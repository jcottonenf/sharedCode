config = {
  redirectUri: window.location.href,
  authorization_endpoint: "https://accounts.examplesite.com",
  token_endpoint: "https://accounts.examplesite.com/sso/v2/tokens"
};

// ssoLoginHandler example methods LWC
connectedCallback() {
  // create listener for the UIE form submission
  this._loginButtonClicked = this.loginButtonClicked.bind(this);
  window.addEventListener("ebcm_form_event", this._loginButtonClicked);
}

disconnectedCallback() {
  window.removeEventListener("ebcm_form_event", this._loginButtonClicked);
}

loginButtonClicked(event) {
  //check if hidden field value to proceed with login and get token
  let detail = event.detail && JSON.parse(event.detail);
  //only redirect on login form
  if (detail && detail.loginForm == "authLogin") {
    let url = this.config.authorization_endpoint + "?redirectUri=" + encodeURIComponent(this.config.redirectUri);
    sessionStorage.setItem("ebcm__loginSent", true); // this can be used later to continue bot flow
    // Redirect to the authorization server
    window.location = url;
  }
}
