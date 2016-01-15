chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('main.html', {
		id: 'MainWindowID',
		innerBounds: {
			width: 1024,
			height: 768,
		}
	});
});
