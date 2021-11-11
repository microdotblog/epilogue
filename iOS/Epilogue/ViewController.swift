//
//  ViewController.swift
//  Epilogue
//
//  Created by Manton Reece on 10/27/21.
//

import UIKit
import WebKit
import UUSwiftCore
import UUSwiftNetworking
import AuthenticationServices

class ViewController: UIViewController, WKNavigationDelegate, ASAuthorizationControllerDelegate {

	@IBOutlet var webView: WKWebView!
	
	var token = ""
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		self.setupNotifications()
		self.setupWebView()
	}
	
	func setupNotifications() {
		NotificationCenter.default.addObserver(self, selector: #selector(tokenReceivedNotification(_:)), name: .tokenReceivedNotification, object: nil)
	}
	
	func setupWebView() {
		self.webView.navigationDelegate = self

		if let token = UUKeychain.getString(key: "Token") {
			if token.count > 0 {
				self.token = token
				self.setupPage("index")
			}
			else {
				self.setupPage("signin")
			}
		}
		else {
			self.setupPage("signin")
		}
	}
	
	func setupPage(_ filename: String) {
		let url = Bundle.main.url(forResource: filename, withExtension: "html", subdirectory: "Web")
		if let url = url {
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
			if token.count > 0 {
				UUKeychain.saveString(key: "Token", acceessLevel: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly, string: token)
				self.token = token
				self.setupPage("index")
			}
			else {
				UUKeychain.remove(key: "Token")
				self.token = ""
				self.setupPage("signin")
			}
		}
	}
	
	func signInWithApple() {
		let provider = ASAuthorizationAppleIDProvider()
		
		let request = provider.createRequest()
		request.requestedScopes = [ .fullName, .email ]
		
		let controller = ASAuthorizationController(authorizationRequests: [ request ])
		controller.delegate = self
		
		controller.performRequests()
	}

	func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
		if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
			let user_id = credential.user
			let identity_token = credential.identityToken
			let email = credential.email
			var full_name = ""
			if let identity_token = identity_token {
				if let identity_token_s = String(data: identity_token, encoding: .utf8) {
					if let name_components = credential.fullName {
						if let first_name = name_components.givenName, let last_name = name_components.familyName {
							full_name = "\(first_name) \(last_name)"
						}
					}
					
					var s = ""
					s += "user_id=" + user_id.uuUrlEncoded()
					s += "&full_name=" + full_name.uuUrlEncoded()
					s += "&identity_token=" + identity_token_s.uuUrlEncoded()
					if let email = email {
						s += "&email=" + email.uuUrlEncoded()
					}
					
					let d = s.data(using: .utf8)
					
					let request = UUHttpRequest(url: "https://micro.blog/account/apple", method: .post, body: d, contentType: "application/x-www-form-urlencoded")
					let _ = UUHttpSession.executeRequest(request) { response in
						if let info = response.parsedResponse as? [ String: String ] {
							let username = info["username"]
							let token = info["token"]
							let error = info["error"]
							
							if error != nil {
								// show error message
								if let s = error {
									let js = "document.epilogueShowError(\"\(s)\");"
									DispatchQueue.main.async {
										self.webView.evaluateJavaScript(js)
									}
								}
							}
							else if let username = username, username.count > 0 {
								// user already has an account, sign them in
								if let token = token {
									DispatchQueue.main.async {
										NotificationCenter.default.post(name: .tokenReceivedNotification, object: self, userInfo: [ "token": token ])
									}
								}
							}
							else {
								// show username picker
								// pass user_id and identity_token_s
								// ...
							}
						}
					}
				}
			}
		}
	}
	
	func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
		print(error)
	}
	
	func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
		if self.token.count > 0 {
			let js = "checkToken(\"\(self.token)\");"
			self.webView.evaluateJavaScript(js)
		}
	}
	
	func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Swift.Void) {
		var handled = false
		
		if let url = navigationAction.request.url {
			if url.absoluteString.contains("epilogue://") {
				if url.host == "apple" {
					handled = true
					self.signInWithApple()
				}
				else if url.host == "signin" {
					handled = true
					let token = url.lastPathComponent
					NotificationCenter.default.post(name: .tokenReceivedNotification, object: self, userInfo: [ "token": token ])
				}
				else if url.host == "signout" {
					handled = true
					let token = ""
					NotificationCenter.default.post(name: .tokenReceivedNotification, object: self, userInfo: [ "token": token ])
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

