var states = {
	active: {
		icons: {
			'16': 'icon-color-16.png',
			'32': 'icon-color-32.png',
			'48': 'icon-color-48.png',
			'128': 'icon-color-128.png'
		},
		title: 'Turn black and white mode off'
	},
	inactive: {
		icons: {
			'16': 'icon-bw-16.png',
			'32': 'icon-bw-32.png',
			'48': 'icon-bw-48.png',
			'128': 'icon-bw-128.png'
		},
		title: 'Turn black and white mode on'
	}
};
function activateBlackAndWhiteMode() {
	document.documentElement.classList.add("black-and-white-mode");
	console.log("Black and white mode activated");
}

function deactivateBlackAndWhiteMode() {
	document.documentElement.classList.remove("black-and-white-mode");
	console.log("Black and white mode deactivated");
}

function setActive(activate, tabId) {
	console.log('setActive called with activate:', activate, 'tabId:', tabId);
	var props = activate ? states.active : states.inactive;
	chrome.action.setIcon({ path: props.icons, tabId: tabId });
	chrome.action.setTitle({ title: props.title, tabId: tabId });
	
	if (activate) {
		chrome.scripting.insertCSS({ 
			target: { tabId: tabId, allFrames: true }, 
			files: ['black-and-white.css']
		}, function() {
			if (chrome.runtime.lastError) {
				console.error('Error inserting CSS:', chrome.runtime.lastError);
				return;
			}
			console.log('CSS inserted successfully');
			chrome.scripting.executeScript({ 
				target: { tabId: tabId, allFrames: true }, 
				func: activateBlackAndWhiteMode
			}, (results) => {
				if (chrome.runtime.lastError) {
					console.error('Error executing script:', chrome.runtime.lastError);
				} else {
					console.log('Script executed successfully:', results);
					// Save the state for this tab's URL
					chrome.tabs.get(tabId, (tab) => {
						const url = new URL(tab.url).hostname;
						chrome.storage.local.set({[url]: activate}, () => {
							if (chrome.runtime.lastError) {
								console.error('Error saving state:', chrome.runtime.lastError);
							} else {
								debugStorage('set', url, activate);
							}
						});
					});
				}
			});
		});
	} else {
		chrome.scripting.removeCSS({ 
			target: { tabId: tabId, allFrames: true }, 
			files: ['black-and-white.css']
		}, function() {
			if (chrome.runtime.lastError) {
				console.error('Error removing CSS:', chrome.runtime.lastError);
				return;
			}
			console.log('CSS removed successfully');
			chrome.scripting.executeScript({ 
				target: { tabId: tabId, allFrames: true }, 
				func: deactivateBlackAndWhiteMode
			}, (results) => {
				if (chrome.runtime.lastError) {
					console.error('Error executing script:', chrome.runtime.lastError);
				} else {
					console.log('Script executed successfully:', results);
					// Save the state for this tab's URL
					chrome.tabs.get(tabId, (tab) => {
						const url = new URL(tab.url).hostname;
						chrome.storage.local.set({[url]: activate}, () => {
							if (chrome.runtime.lastError) {
								console.error('Error saving state:', chrome.runtime.lastError);
							} else {
								debugStorage('set', url, activate);
							}
						});
					});
				}
			});
		});
	}
}

chrome.action.onClicked.addListener(function(tab) {
	console.log('Action clicked for tab:', tab.id);
	chrome.action.getTitle({ tabId: tab.id }, function(title) {
		console.log('Current title:', title);
		if (title !== states.active.title) {
			console.log('Activating black and white mode');
			chrome.scripting.insertCSS({ 
				target: { tabId: tab.id, allFrames: true }, 
				files: ['black-and-white.css']
			}, function() {
				if (chrome.runtime.lastError) {
					console.error('Error inserting CSS:', chrome.runtime.lastError);
					return;
				}
				console.log('CSS inserted successfully');
				setActive(true, tab.id);
			});
		} else {
			console.log('Deactivating black and white mode');
			chrome.scripting.removeCSS({ 
				target: { tabId: tab.id, allFrames: true }, 
				files: ['black-and-white.css']
			}, function() {
				if (chrome.runtime.lastError) {
					console.error('Error removing CSS:', chrome.runtime.lastError);
					return;
				}
				console.log('CSS removed successfully');
				setActive(false, tab.id);
			});
		}
	});
});

// Add this new listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		const url = new URL(tab.url).hostname;
		console.log("get url:" + url);
		chrome.storage.local.get(url, (result) => {
			debugStorage('get', url, result[url]);
			if (chrome.runtime.lastError) {
				console.error('Error retrieving state:', chrome.runtime.lastError);
				return;
			}
			if (result[url]) {
				chrome.scripting.insertCSS({ 
					target: { tabId: tabId, allFrames: true }, 
					files: ['black-and-white.css']
				}, function() {
					if (chrome.runtime.lastError) {
						console.error('Error inserting CSS:', chrome.runtime.lastError);
						return;
					}
					console.log('CSS inserted successfully');
					setActive(true, tabId);
				});
			}
		});
	}
});

// 添加一个新的监听器来测试存储
chrome.runtime.onInstalled.addListener(() => {
	chrome.storage.local.set({test: 'Hello, Storage!'}, () => {
		if (chrome.runtime.lastError) {
			console.error('Error setting test value:', chrome.runtime.lastError);
		} else {
			debugStorage('set', 'test', 'Hello, Storage!');
			chrome.storage.local.get('test', (result) => {
				debugStorage('get', 'test', result.test);
			});
		}
	});
});

// 在文件顶部添加这个函数
function debugStorage(action, key, value) {
	console.log(`Storage ${action}:`, { key, value });
	chrome.storage.local.get(null, function(items) {
		console.log('All storage items:', items);
	});
}