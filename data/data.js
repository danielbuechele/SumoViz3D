var requestURL = document.URL;
var queryString = requestURL.substring(requestURL.indexOf("?") + 6, requestURL.length);

var filename = queryString;
var pedestrianData = jQuery.getJSON("/sumoviz3d/_design/"+filename+"/_view/ped?group=true");
var geometryData = jQuery.getJSON("/sumoviz3d/_design/"+filename+"/_view/geo");
var groupData = jQuery.getJSON("/sumoviz3d/_design/"+filename+"/_view/group?group=true");
