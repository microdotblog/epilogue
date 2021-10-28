//
//  SceneDelegate.swift
//  Epilogue
//
//  Created by Manton Reece on 10/27/21.
//

import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

	var window: UIWindow?

	func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
		guard let _ = (scene as? UIWindowScene) else { return }
	}

	func sceneDidDisconnect(_ scene: UIScene) {
	}

	func sceneDidBecomeActive(_ scene: UIScene) {
	}

	func sceneWillResignActive(_ scene: UIScene) {
	}

	func sceneWillEnterForeground(_ scene: UIScene) {
	}

	func sceneDidEnterBackground(_ scene: UIScene) {
	}

	func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
		if let urlContext = URLContexts.first {
			let url = urlContext.url
			if url.host == "signin" {
				let token = url.lastPathComponent
				NotificationCenter.default.post(name: .receivedTokenNotification, object: self, userInfo: [ "token": token ])
			}
		}
	}
	
}

