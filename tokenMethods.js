//---------- BOT LOADER CODE ----------------
function initSendMessage() {
  //LWC will send "ebcm__send_message" - dialogs setup for different auth paths
    window.addEventListener("ebcm__send_message", event => {
        if ((event.detail == "#EBCM--BOT-GREETING-START#" || event.detail == "#EBCM--CONTINUE-TOKEN-FALSE#") && embedded_svc.liveAgentAPI.browserSessionInfo.activeChatSessions > 1) return; //prevent double greeting
        let element = document.getElementsByClassName("chasitorText")[0];
        if (event.detail) {
            element.value = event.detail;
            element.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 13 }));
            element.value = "";
        }
    });
}

initSendMessage();


//---------- SSOLOGINHANDER LWC CODE ----------------
import saveToken from "@salesforce/apex/NF_SsoLoginHandlerController.saveToken";

chatKey = "";
token = "";
lastMessage = "";
visitorDetails = {};


connectedCallback() {
	this._isUserAuthenticated = this.isUserAuthenticated.bind(this);
	window.addEventListener("ebcm__isUserAuthenticated", this._isUserAuthenticated);
}

disconnectedCallback() {
	window.removeEventListener("ebcm__isUserAuthenticated", this._isUserAuthenticated);
}

isUserAuthenticated(event) {
	//NF_AuthTokenHelper and NF_CryptoUtil classes
	let detail = JSON.parse(event.detail.replaceAll("&#x27;", '"'));
	this.chatKey = this.chatKey ? this.chatKey : detail.chatKey;
	this.sendMessage = this.sendMessage ? this.sendMessage : detail.flow;
	sessionStorage.setItem("ebcm__chatKey", this.chatKey);

	const callbackToken = (token) => {
		this.saveToken(token, this.sendMessage);
	};

	const callbackNotLoggedIn = () => {
		this.sendMessageToBot("#EBCM--CONTINUE-TOKEN-FALSE#");
	};

	if (sessionStorage.getItem("ebcm__loginSent") || !sessionStorage.getItem("ebcm__init")) {
		this.fetchToken(this.config.token_endpoint, callbackToken, callbackNotLoggedIn);
		sessionStorage.setItem("ebcm__init", true);
	}
}

saveToken(token, messageText) {
	if (!this.tokenSavedMobile) {
		saveToken({ chatKey: this.chatKey, token: token, tokenFieldApiName: "Auth_Token__c" })
			.then(result => {
				this.sendMessageToBot(messageText);
			})
			.catch(error => {
				console.log("saveToken error ", error);
				this.sendMessageToBot(messageText);
			});
	} else {
		this.sendMessageToBot(messageText);
	}
}

sendMessageToBot(message) {
	window.dispatchEvent(new CustomEvent("ebcm__send_message", { detail: message }));
	this.sendMessage = "";
	sessionStorage.removeItem("ebcm__lastMessage");
}

fetchToken(url, callbackToken, callbackNotLoggedIn) {
	if (!this.tokenSavedMobile) {
		fetch(url, {
			method: "GET",
			credentials: "include", //this is important to retain header and cookies
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json"
			}
		})
			.then(data => {
				if (data.status == "204") {
					console.log("user not logged in");
					callbackNotLoggedIn();
				} else {
					return data.text();
				}
			})
			.then(res => {
				if (res) {
					let response = JSON.parse(res);
					response.forEach(item => {
						if (item.name.includes("idToken")) {
							this.token = item.value;
							this.idToken = this.parseJwt(item.value);
							this.visitorDetails.email = this.idToken.email;
							this.userLoggedIn = true;
						}
					});
					callbackToken(this.token, this.visitorDetails);
				}
			})
			.catch(err => {
				console.log("request failed", err);
				this.userLoggedIn = false;
				callbackNotLoggedIn();
			});
	} else {
		callbackToken(this.token, this.visitorDetails);
	}
}

parseJwt(token) {
	let base64Url = token.split(".")[1];
	try {
		let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		let jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map(function (c) {
					return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
				})
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch {
		let error = "JWT parse error";
		throw error;
	}
}
