//
//  ViewController.swift
//  Epilogue
//
//  Created by Manton Reece on 10/27/21.
//

import UIKit
import WebKit

class ViewController: UIViewController {

	@IBOutlet var webView: WKWebView!
	
	override func viewDidLoad() {
		super.viewDidLoad()
		
		let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Web")
		if let url = url {
			self.webView.loadFileURL(url, allowingReadAccessTo: url)
		}
	}

}

