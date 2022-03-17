/*var xhr = new XMLHttpRequest(), doc = document;
xhr.responseType = 'blob';
//xhr.overrideMimeType("text/plain");
xhr.open('GET', "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.min.js", true);
xhr.onload = function () {

    var script = doc.createElement('script'),
        src = URL.createObjectURL(xhr.response);

    script.src = src;
    doc.body.appendChild(script);
};
xhr.send();*/
var canvas_width = "550px";
var canvas_height = "1000px";
var searchText = "";
var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.min.js';
head.appendChild(script);

function mouse_event() {
    searchText = window.getSelection().toString();
    pagesearch();
}

function openTextFile() {
    var input = document.createElement("input");

    input.type = "file";
    // html일 경우 text/html로
    input.accept = ".pdf,.txt";

    input.click();
    input.onchange = function (event) {
        processFile(event.target.files[0]);
    };
    document.body.addEventListener("mouseup", mouse_event);
}

async function processFile(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file, "utf-8");
    reader.onload = async function () { // test.innerText = reader.result;
        var PDFJS = pdfjsLib;
        var pdfAsDataUri = reader.result; // shortened
        var pdfAsArray = convertDataURIToBinary(pdfAsDataUri);
        PDFJS.getDocument(pdfAsArray).then(async function (PDF_DOC) {
            _PDF_DOC = PDF_DOC;
            document.querySelector("#pdf-loader").style.display = 'block';
            _TOTAL_PAGES = PDF_DOC.numPages;
            document.querySelector("#pdf-loader").style.display = 'none';
            document.querySelector("#pdf-contents").style.display = 'block';
            document.querySelector("#pdf-total-pages").innerHTML = _TOTAL_PAGES;
            showPage(1);
        });
    };
}

var hello = "파일 open";
var tag = document.createElement('div');
tag.className = "field";
tag.innerHTML = `<button id="show-pdf-button" class="button_" style="display:inline; width:20%; height:2%">${hello}</button><button id="pdf-prev" class="button_" style="width:20%; height:2%;">Previous</button><button id="pdf-next" class="button_" style="width:20%; height:2%;">Next</button><button id="show-pdf-button" class="button_" style="display:inline; width:20%; height:2%">검색</button><div id="page-count-container" class="inline">Page <div id="pdf-current-page" class="inline"></div> of <div id="pdf-total-pages" class="inline"></div></div>
    <div id="pdf-main-container" style="position:absolute; top:-10px; padding:0px; margin:0px; z-index:-3; overflow:auto; width:100%; height:100%">
        <div id="pdf-loader">Loading document ...</div>
        <div id="pdf-contents">
            <canvas id="pdf-canvas" width="${canvas_width}" height="${canvas_height}" style=" " ></canvas>
            <div id="page-loader">Loading page ...</div>
        </div>
    </div>`;
document.body.appendChild(tag);
tag.setAttribute("style", `position: fixed; width:${canvas_width}; height:100%; right: 0; top:0; z-index:3000;`);
document.getElementById("show-pdf-button").addEventListener("mouseup",function(event){openTextFile(); event.stopPropagation();});

var mytable = document.createElement('div');
mytable.className = "field";
mytable.innerHTML = `<table>
        <caption>List</caption>
        <tbody id="tbody_" class="tbody_" ></tbody>
        </table>`;
mytable.setAttribute("style", `overflow:scroll; position: fixed; width:${canvas_width}; height:100%; left: 0; top:0; z-index:3000;`);
document.body.appendChild(mytable);


function printNewLine(arg) { // 새로운 테이블 출력
    return new Promise(function (resolve, reject) {
        var text;
        text = arg; // Array.from(arguments[0]);
        mytable = document.getElementById("tbody_");
        mytable.innerHTML = "";
        var count = 0;
        for (var n in text) {
            for (var i in text[n].items) {
                (function(n,i){
                    var row = mytable.insertRow(count);
                    row.insertCell(0).innerHTML = `<td><div class="show_link"> ${text[n].page} : ${text[n].items[i]} </div></td>`;
                    document.body.getElementsByClassName("show_link")[count].addEventListener("mouseup",function(event){showPage(text[n].page); event.stopPropagation();});
                    count++;
                    row = mytable.insertRow(count);
                    row.insertCell(0).innerHTML = "<td><div class='show_link'>" + "-------------------------------------" + "</div></td>";
                    count++;
                }(n,i));
                
            }
        }
        resolve();
    })
}

var BASE64_MARKER = ';base64,';
function convertDataURIToBinary(dataURI) {
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for (var i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

var _PDF_DOC,
    _CURRENT_PAGE,
    _TOTAL_PAGES,
    _PAGE_RENDERING_IN_PROGRESS = 0,
    _CANVAS = document.querySelector('#pdf-canvas');

async function showPage(page_no) {
    _PAGE_RENDERING_IN_PROGRESS = 1;
    _CURRENT_PAGE = page_no;

    // disable Previous & Next buttons while page is being loaded
    document.querySelector("#pdf-next").disabled = true;
    document.querySelector("#pdf-prev").disabled = true;

    // while page is being rendered hide the canvas and show a loading message
    document.querySelector("#pdf-canvas").style.display = 'none';
    document.querySelector("#page-loader").style.display = 'block';

    // update current page
    document.querySelector("#pdf-current-page").innerHTML = page_no;

    // get handle of page
    try {
        var page = await _PDF_DOC.getPage(page_no);
    } catch (error) {
        alert(error.message);
    }

    // original width of the pdf page at scale 1
    var pdf_original_width = page.getViewport(1).width;

    // as the canvas is of a fixed width we need to adjust the scale of the viewport where page is rendered
    var scale_required = _CANVAS.width / pdf_original_width;

    // get viewport to render the page at required scale
    var viewport = page.getViewport(scale_required);

    // set canvas height same as viewport height
    _CANVAS.height = viewport.height;

    // setting page loader height for smooth experience
    document.querySelector("#page-loader").style.height = _CANVAS.height + 'px';
    document.querySelector("#page-loader").style.lineHeight = _CANVAS.height + 'px';

    var render_context = {
        canvasContext: _CANVAS.getContext('2d'),
        viewport: viewport
    };

    // render the page contents in the canvas
    try {
        await page.render(render_context);
    } catch (error) {
        alert(error.message);
    }

    _PAGE_RENDERING_IN_PROGRESS = 0;

    // re-enable Previous & Next buttons
    document.querySelector("#pdf-next").disabled = false;
    document.querySelector("#pdf-prev").disabled = false;

    // show the canvas and hide the page loader
    document.querySelector("#pdf-canvas").style.display = 'block';
    document.querySelector("#page-loader").style.display = 'none';
    document.getElementById("pdf-main-container").scrollTo(50, 50);
}

// click on "Show PDF" buuton


// click on the "Previous" page button
document.querySelector("#pdf-prev").addEventListener('mouseup', function (event) {
    if (_CURRENT_PAGE != 1) 
        showPage(-- _CURRENT_PAGE);
    event.stopPropagation();
});

// click on the "Next" page button
document.querySelector("#pdf-next").addEventListener('mouseup', function (event) {
    if (_CURRENT_PAGE != _TOTAL_PAGES) 
        showPage(++ _CURRENT_PAGE);
    event.stopPropagation();
});

var div_ = document.querySelectorAll('.inline');
for (var n of div_) {
    n.setAttribute('style', 'display:inline; ');
}
var button_ = document.querySelectorAll('.button_');
for (var n of button_) {
    n.setAttribute('style', 'display:inline; color: #fff; background-color: blue; border-color: blue; box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.4);');
}
async function pagesearch() {
    searchText = searchText.trim();
    if (searchText.length < 2 || searchText.indexOf("\\")>=0) 
        return null;
    
    document.body.removeEventListener("mouseup", mouse_event);
    document.getElementById("tbody_").innerHTML = "검색중 작업불가";
    var results = [];
    for (var pageNum = 1; pageNum <= _PDF_DOC.numPages; pageNum++) {
        results.push(searchPage(pageNum));
    }
    Promise.all(results).then(lists => printNewLine(lists)).then(() => document.body.addEventListener("mouseup", mouse_event));
}

async function searchPage(pageNumber) {
    var doc = _PDF_DOC;
    return doc.getPage(pageNumber).then(function (page) {
        return page.getTextContent();
    }).then(function (content) { // Search combined text content using regular expression
        var lastY = -1;
        var p = null;
        var text = content.items.map(function (i) { // return i.str;
            if (lastY != i.transform[5]) {
                lastY = i.transform[5];
                if(i.str.charCodeAt(0) < 57300 && i.str.charCodeAt(0)>36){
                    i.str = i.str+"</br>";
                }
            }
            return i.str;
        }).join('');
        //console.log(text);
        try{
            var re = new RegExp("(.{0,150})" + searchText + "(.{0,150})", "gi");
        }catch(e){
            return {page:null,item:null};
        }
        var m;
        var lines = [];
        while (m = re.exec(text)) {
            var line = (m[1] ? ".." : "") + m[0] + (m[2] ? ".." : "");
            lines.push(line);
        }
        //console.log(lines);
        return {page: pageNumber, items: lines};
    });
}
