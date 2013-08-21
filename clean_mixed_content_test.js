const gHttpTestRoot = "http://example.com/browser/browser/base/content/test/";
const numTabs = 6;

var urls = [];

function test() {
  var i;

  requestLongerTimeout(5000);
  waitForExplicitFinish();

  // make sure mixed content blocking preferences are correct
  Services.prefs.setBoolPref("security.mixed_content.block_display_content", false);
  Services.prefs.setBoolPref("security.mixed_content.block_active_content", true);

  // load the list of domains and generate urls
  var req = new XMLHttpRequest();
  req.onload = function() {
    // build urls
    var domains = this.responseText.trim().split("\n");
    for(i=0; i<domains.length; i++) {
      var domain = domains[i].trim();
      if(domain != '') {
        urls.push('https://'+domain);
      }
    }

    // start loading all the tabs
    for(i=0; i<numTabs; i++) {
      newTab();
    }
  }
  req.open("get", gHttpTestRoot + "top-1m.csv", true); // substitute your own URL/CSV here
  req.send();
}

function newTab() {
  // open a new tab
  var tab = gBrowser.addTab();
  tab.linkedBrowser.stop();
	gBrowser.selectedTab = tab;

  // start a test in this tab
  if(urls.length) {
    var url = urls.pop();
    tab.contentWindow.location = url;

    // wait for the page to load
    setTimeout(function(){
      // detect mixed content blocker
      if(PopupNotifications.getNotification("mixed-content-blocked", tab)) {
        ok(false, "URL caused mixed content: "+url);

        // todo: print this in the live window
        // and also save it to a file
      }

      // close this tab, and open another
      gBrowser.removeTab(tab);
      newTab();
    }, 6000);
  } else {
    setTimeout(finish, 6500);
  }
}
