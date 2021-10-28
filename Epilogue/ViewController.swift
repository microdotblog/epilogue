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
			let js = "document.epilogueToken = \"\(self.token)\""
			self.webView.evaluateJavaScript(js)
		}
	}

}

