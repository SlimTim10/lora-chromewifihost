var chromewifihostApp = angular.module("chromewifihostApp", []);

chromewifihostApp.controller("MainCtrl", function($scope) {
	var decoder = new TextDecoder();
	var encoder = new TextEncoder();
	var logArea = document.getElementById("log-area");

	var init = function() {
		$scope.title = "Chrome Wi-Fi Host";
		$scope.log = "";
		$scope.socketId;

		$scope.gateway = {
			ip: "192.168.4.1",
			port: "80",
			connected: false
		};
	};

	// Automatic scrolling in log area
	$scope.$watch("log", function() {
		logArea.scrollTop = logArea.scrollHeight;
	});

	$scope.closeApp = function() {
		// Close all open sockets before exiting
		chrome.sockets.tcp.getSockets(function(socketInfos) {
			for (var i = 0; i < socketInfos.length; i++) {
				chrome.sockets.tcp.close(socketInfos[i].socketId);
			}
			window.close();
		});
	};

	$scope.connect = function() {
		chrome.sockets.tcp.getSockets(function(socketInfos) {
			// Only allow one socket at a time
			if (socketInfos.length != 0) return;
			chrome.sockets.tcp.create({}, function(createInfo) {
				$scope.$apply(function() {
					$scope.socketId = createInfo.socketId;
					$scope.log = "Connecting...\n";
					chrome.sockets.tcp.connect(createInfo.socketId, $scope.gateway.ip, parseInt($scope.gateway.port), function(result) {
						$scope.$apply(function() {
							if (chrome.runtime.lastError) {
								$scope.log += "Error connecting\n" + chrome.runtime.lastError.message + "\n";
								chrome.sockets.tcp.close(createInfo.socketId, function() {
									$scope.$apply(function() {
										$scope.log += "Socket closed\n";
									});
								});
							} else {
								$scope.gateway.connected = true;
								$scope.log += "Connected to " + $scope.gateway.ip + ":" + $scope.gateway.port + "\n\n";
								chrome.sockets.tcp.onReceive.addListener(function(info) {
									$scope.$apply(function() {
										$scope.log += "< " + decoder.decode(info.data) + "\n";
									});
								});
							}
						});
					});
				});
			});
		});
	};

	$scope.disconnect = function() {
		chrome.sockets.tcp.getInfo($scope.socketId, function(socketInfo) {
			if (socketInfo.connected) {
				chrome.sockets.tcp.disconnect(socketInfo.socketId, function() {
					$scope.$apply(function() {
						$scope.gateway.connected = false;
						$scope.log += "Disconnected\n";
					});
				});
				chrome.sockets.tcp.close(socketInfo.socketId, function() {
					$scope.$apply(function() {
						$scope.log += "Socket closed\n";
					});
				});
			}
		});
	};

	$scope.sendMsg = function(msg) {
		chrome.sockets.tcp.getInfo($scope.socketId, function(socketInfo) {
			$scope.$apply(function() {
				if (socketInfo.connected) {
					var data = encoder.encode(msg).buffer;
					chrome.sockets.tcp.send(socketInfo.socketId, data, function(sendInfo) {
						$scope.$apply(function() {
							if (chrome.runtime.lastError) {
								$scope.log += "Error sending\n" + chrome.runtime.lastError.message + "\n";
							} else {
								$scope.log += "> " + msg + "\n";
							}
						});
					});
				} else {
					$scope.log += "Not connected\n";
				}
			});
		});
	};

	init();
});
