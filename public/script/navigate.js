

var xhttp2=new XMLHttpRequest();
xhttp2.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       // Typical action to be performed when the document is ready:
       document.getElementById("hd").innerHTML = xhttp2.responseText;
    }
};
xhttp2.open("GET", "/template/header.txt", true);
xhttp2.send();


var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       // Typical action to be performed when the document is ready:
       document.getElementById("nav").innerHTML = xhttp.responseText;
    }
};
xhttp.open("GET", "/template/navi.txt", true);
xhttp.send();

var myvar;
function affect()
	{
		var x= document.getElementById("opt").style.opacity;
		if (parseFloat(x)==1)
		{
			clearInterval(myvar);
			return;
		}
		document.getElementById("opt").style.opacity= parseFloat(x)+0.1;
	}
function option()
	{
		if (document.getElementById("opt").style.visibility != "hidden")
		{
			document.getElementById("opt").style.visibility = "hidden";
		}else{
			document.getElementById("opt").style.opacity=0.0;		
			document.getElementById("opt").style.visibility = "visible";
			myvar=setInterval(affect,50);
		}
	}