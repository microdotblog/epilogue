//
//  ViewController.swift
//  Epilogue
//
//  Created by Manton Reece on 10/27/21.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {

	@IBOutlet var webView: WKWebView!
	
	var token = ""
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.setupNotifications()
		self.setupWebView()
	}
	
	func setupNotifications() {
		NotificationCenter.default.addObserver(self, selector: #selector(tokenReceivedNotification(_:)), name: .receivedTokenNotification, object: nil)
	}
	
	func setupWebView() {
		let url = Bundle.main.url(forResource: "signin", withExtension: "html", subdirectory: "Web")
		if let url = url {
			self.webView.navigationDelegate = self
			self.webView.loadFileURL(url, allowingReadAccessTo: url)
		}
	}

	override var supportedInterfaceOrientations: UIInterfaceOrientationMask {
		return UIInterfaceOrientationMask.portrait
	}
  
	override var shouldAutorotate: Bool {
		return false
	}

	@objc func tokenReceivedNotification(_ notification: Notification) {
		if let token = notification.userInfo?["token"] as? String {
			self.token = token
			let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web")
			if let url = url {
				self.webView.loadFileURL(url, allowingReadAccessTo: url)
			}
		}
	}

	func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
		if self.token.count > 0 {
			let js = "document.epilogueToken = \"\(self.token)\"; checkToken();"
			self.webView.evaluateJavaScript(js)
		}
	}
	
	func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
		var handled = false
		
		if let url = navigationAction.request.url {
			if url.absoluteString.contains("epilogue://") {
				if url.host == "signin" {
					handled = true
					let token = url.lastPathComponent
					NotificationCenter.default.post(name: .receivedTokenNotification, object: self, userInfo: [ "token": token ])
				}
			}
		}
		
		if handled {
			decisionHandler(.cancel)
		}
		else {
			decisionHandler(.allow)
		}
	}

}

