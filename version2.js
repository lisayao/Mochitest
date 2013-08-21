/*

ad-hoc mochitests for bug 822367

NOTE: This test requires downloading a CSV file of top domains from Alexa's web site
Also note: This test is quite a hack.

*/
const PREF_DISPLAY = "security.mixed_content.block_display_content";
const PREF_ACTIVE = "security.mixed_content.block_active_content";
const gHttpTestRoot = "http://example.com/browser/browser/base/content/test/";
var origBlockDisplay;
var origBlockActive;
var gTestBrowser = null;
var urlIndex1 = 0;
var urlIndex2 = 0;
var interval1;
var interval2;
var rawDomList;
var domList1;
var domList2;
var testURL = "https://people.mozilla.com/~tvyas/mixedcontent.html";
var numURLs = 562;
var tabsdone = 0;

function test() {
  requestLongerTimeout(5000);
  waitForExplicitFinish();

  origBlockDisplay = Services.prefs.getBoolPref(PREF_DISPLAY);
  origBlockActive = Services.prefs.getBoolPref(PREF_ACTIVE);

  Services.prefs.setBoolPref(PREF_DISPLAY, false);  //Note mixed display is currently not going to be blocked by default
  Services.prefs.setBoolPref(PREF_ACTIVE, true);

  var newTab = gBrowser.addTab();
  gBrowser.selectedTab = newTab;
  gTestBrowser = gBrowser.selectedBrowser;
  newTab.linkedBrowser.stop()
  loadDomains();
}

function loadDomains ()
{
  var oReq = new XMLHttpRequest();
  oReq.onload = reqListener;
  oReq.open("get", gHttpTestRoot + "top-1m.csv", true); // substitute your own URL/CSV here
  oReq.send();
}

function reqListener () 
{
	rawDomList = this.responseText.split("\n");

	var temp = new Array();

	// only use first 1000 domains - just for testing purposes

	for (var i=0;i<numURLs;i++)
	{
		temp.push ( "https://" + rawDomList[i].split(",")[1] );
		temp.push ( "https://www." + rawDomList[i].split(",")[1] );
	}
	domList = temp;
	
	length = temp.length;
	domList1 = temp.splice(0,length/2);
	domList2 = temp;

	firstTest(domList1[urlIndex1]);
	if (domList2.length != 0)
	{
	    secondTest(domList2[urlIndex2]);
	}
}

function firstTest(url)
{
  //gTestBrowser.addEventListener("load", checkForMixedContent, true);
  //gTestBrowser.addEventListener("error", handleError, true);
  gTestBrowser.contentWindow.location = url;
  interval1 = setInterval ( cleanup (interval1, domList1, urlIndex1), 6000 );
}

function secondTest(url)
{
    window.focus();
	var newTab = gBrowser.addTab();
	gBrowser.selectedTab = newTab;
	gTestBrowser = gBrowser.selectedBrowser;
	newTab.linkedBrowser.stop()
    gTestBrowser.contentWindow.location = url;
    interval2 = setInterval ( cleanup (interval2, domList2, urlIndex2), 6000 );
}

function cleanup (interval, domList, urlIndex) {
  clearInterval ( interval );
  var notification = PopupNotifications.getNotification("mixed-content-blocked", gTestBrowser);
  if ( notification ) {
    ok( false, "Mixed Content Doorhanger appeared: (" + urlNumber() + ")" + domList[urlIndex]);
  }


  // An aborted attempt at sussing out error conditions

  //var pageTitle = gTestBrowser.contentWindow.document.title;
  //if ( pageTitle === "Untrusted Connection" ) {
    //ok ( false, "Error loading site - Untrusted Connection: (" + urlNumber() + ")" + domList[urlIndex] );
  // } else if ( notification ) {
  //   ok( false, "Mixed Content Doorhanger appeared: (" + urlNumber() + ")" + domList[urlIndex]);
  // } else {
    //ok ( false, "Error loading site - timeout: (" + urlNumber() + ")" + domList[urlIndex] );
  //}

  loadBlankPage(); // get rid of any lingering doorhanger, false positive... also doesn't work
  nextURL(interval, domList, urlIndex);
}


function nextURL(interval, domList, urlIndex) {
  //if ( interval ) clearInterval ( interval );
  urlIndex++;
  if ( urlIndex >= (2*domList.length) ) // rawDomList.length will happen later
  {
    tabsdone++;
    if (tabsdone == 2)
    {
        MixedTestsCompleted();
    }
  } 
  else {
  //it might be a problem to set the "interval" variable like this
    interval = setInterval ( cleanup (interval, domList, urlIndex), 8000 );
    // close tab here and open new one
    gBrowser.removeCurrentTab();
    window.focus();
	var newTab = gBrowser.addTab();
	gBrowser.selectedTab = newTab;
	gTestBrowser = gBrowser.selectedBrowser;
	newTab.linkedBrowser.stop();
    gTestBrowser.contentWindow.location = domList[urlIndex];
  }
}


function urlNumber()
{
	return Math.floor ( urlIndex/2 );
}

registerCleanupFunction(function() {
  // Set preferences back to their original values
  Services.prefs.setBoolPref(PREF_DISPLAY, origBlockDisplay);
  Services.prefs.setBoolPref(PREF_ACTIVE, origBlockActive);
});

function MixedTestsCompleted() {
  //gTestBrowser.removeEventListener("load", checkForMixedContent, true);
  //gTestBrowser.removeEventListener("error", handleError, true);

  gBrowser.removeCurrentTab();
  window.focus();
  finish();
}


function loadBlankPage()
{
  gTestBrowser.contentWindow.location = "about:blank";
}


function handleError () {
  ok ( false, "Error loading site - error event: (" + urlNumber() + ")" + domList[urlIndex] );
  nextURL();
}


function checkForMixedContent() {
  if ( interval ) clearInterval ( interval );
  var notification = PopupNotifications.getNotification("mixed-content-blocked", gTestBrowser);
  ok(!notification, "Mixed Content Doorhanger appeared: (" + urlNumber() + ")" + domList[urlIndex]);
  nextURL();
}


//break list into 2 lists
//separate url number for each list
//replicate variables for each run
//replicate functions for each run (simplify later with input)
//run test on both lists
//when at end of url number, then variable = true
//when checking to run mixed content done, check if both variables are true.
//if both are true, then conclude (or when both are true, then conclude)
//if both are not true, then wait a few seconds and check again