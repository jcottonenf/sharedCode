function lightningOutScript(url) {
    let div = document.createElement("div");
    let s = document.createElement("script");
    div.setAttribute("id", "lightningOut");
    s.setAttribute("src", url + "/lightning/lightning.out.js");
    s.onload = function () {
        buildLightningOutLWC(url);
    };
    document.body.appendChild(div);
    document.body.appendChild(s);
}

function buildLightningOutLWC(url) {
    $Lightning.use(
        "embeddedService:sidebarApp",
        function () {
            $Lightning.createComponent(
                "c:ssoLoginHandler",
                {
                    //apiVar: "test data"
                },
                "lightningOut",
                function (cmp) {
                    console.log("LWC component was created");
                    window.dispatchEvent(new CustomEvent("loutLoaded", { detail: "test" }));
                }
            );
        },
        url
    );
}
