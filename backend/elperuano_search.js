var pageSize = 10;
var pageIndex = 1;
var preload = 0;
window.onload = function () {
    _GetSearchNews();
    _getDolarActualizado();
    _loadNoticiasAndina();
    this._loadEditorialOpinion();
}
$(window).scroll(function () {
    if ($(window).scrollTop() ==
        $(document).height() - $(window).height()) {
        _GetSearchNews();
    }
});

function _GetSearchNews() {
    var search = document.getElementById('search').value;
    if (search != null) {
        var url = '/portal/_SearchNews?pageIndex=' + pageIndex + '&pageSize=' + pageSize + '&claves=' + search;
        var ruta = url;
        document.getElementById("loading").style.visibility = "visible";
        //var ruta = '/seccion/_GetNoticiasSeccionPagingWorker?id=1';
        $.ajax({
            type: 'GET',
            url: ruta,
            contentType: JSON,
            processData: false,
            success: function (data) {
                var row = "";
                //document.getElementById('seccionnombre').innerHTML = data[0].Seccion;
                $.each(data, function (index, item) {
                    row += "<article>";

                    row += "<div class='nota col s12 no-padding paddinglat10-600'>";
                    row += "<div class='card z-depth-0 card-600 borderadius6-600 cursornoticia'>";
                    row += "<div class='row no-margin'>";
                    row += "<div class='col s6 m6 l4 xl4 no-padding-600'>";
                    row += "<div class='card-images'>";
                    row += "<figure class='fotonoticia no-margin-600'>";
                    row += "<a href='../" + item.URLFriendLy+"'><span class='card-title3'>" + ToJavaScriptDate(item.dtmFecha) + "</span>";
                    row += "<img src='"+ item.vchRutaCompletaFotografia +"' class='fotonoticiah fotobackground' alt='FOTOGRAFIA' title='title'/></a>";
                    row += "</figure>";
                    row += "</div>";
                    row += "</div>";
                    row += "<div class='col s6 m6 l8 xl8'>";
                    row += "<div class='card-content no-padding paddingtop10-600'>";
                    row += "<div class='valign-wrapper'>";
                    row += "<p class='red-text tex-darken-4 marginbottom5'><a href='../" + item.URLFriendLy+"' class='seccionrojo'>"+item.Seccion+"</a></p>";
                    row += "<div class='inlineblock width100 hide-on-large-only'>";
                    row += "<a class='btn btn-compartirindex waves-effect waves-light modal-trigger right' href='#modal1'><span class='fa fa-ellipsis-h'></span></a>";
                    row += "</div>";
                    row += "</div>";
                    row += "<span class='card-title2'><a href='../" + item.URLFriendLy+"' class='titular'>"+ item.vchTitulo +"</a></span>";
                    row += "<p class='truncate05 truncate03-800 truncate02-450 truncate02-390 displaynone-450 displaynone-390'><a href='../" + item.URLFriendLy+"' class='bajada'>" + item.vchDescripcion+" </a></p>";
                    row += "</div>";
                    row += "</div>";
                    row += "</div>";
                    row += "</div>";
                    row += "</div>";
                    row += "</article>";

                });
                document.getElementById("loading").style.visibility = "hidden";
                if (preload == 0) {
                    $("#notassearch").html(row);
                    preload = 1;
                } else {
                    $("#notassearch").append(row);
                }

                pageIndex++;
            },
            error: function () {
                alert("Error en la carga de Normas");
            },
        });
    }


}
function ToJavaScriptDate(Jsonfecha) {
    var date = new Date(parseInt(Jsonfecha.substr(6)));
    var formatted = ("0" + date.getDate()).slice(-2) + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + date.getFullYear();

    return formatted;

}
function _getDolarActualizado() {
    //Obtiene el ultimo valor del Dolar RL
    //document.getElementById('NoticiasMedios').innerHTML = '<img src="../static/img/spinner.gif" alt="Cargando" />';
    var ruta = '/Portal/_GetDolarActualizado';
    $.ajax({
        type: 'GET',
        url: ruta,
        contentType: JSON,
        processData: false,
        success: function (data) {
            var row = " <li>Tipo de cambio:</li>";
            var rowPub = "";
            row += "<li class='compra'>Compra: " + data.intCompra + "</li>";
            row += "<li class='venta'>Venta:" + data.intVenta + "</li> <br>";
            row += " <li class='red-text text-darken-4 bold'>Año de la Esperanza y el Fortalecimiento de la Democracia</li>";

            //Verificacion de Publicidad
            if (data.ArchivoPublicidad !== 'NO') {
                rowPub += "<a href='" + data.LinkPublicidad + "'>" + data.ArchivoPublicidad; + "</a>"
                rowPub += "<div class='divider no-margin'></div>";

            }
            $("#uldolar").html(row);
            $("#skyscraper-horizontal").html(rowPub);

            _loadVinculosPortada();
        },
        error: function () {
            alert("Error en la carga");
        },
    });
}
function _loadNoticiasAndina() {

    var ruta = '/Portal/_GetNoticiasAndina';
    $.ajax({
        type: 'GET',
        url: ruta,
        contentType: JSON,
        processData: false,
        success: function (data) {
            var row = "";
            row += "<div class='red darken-4 white-text'>";
            row += "<h6 class='padding10 marginbottom0'>Ultimas noticias</h6>";
            row += "</div>";
            row += "<div class='collection lh10 margintop0 '>";
            row += "<div class='left-align'>";

            $.each(data, function (index, item) {
                row += "<a href='" + item.URL + "' class='fz09 lh18 padding10 collection-item grey-text text-darken-3 dawn-pink border1white bajada' _blank>";
                row += "<b class='red-text text-darken-4'>(" + item.vchHora + ")</b> " + item.vchTitulo;
                row += "</a>";
            });
            row += "</div>";
            row += "</div>";


            $("#ultimasnoticiaandina").html(row);

        },
        error: function () {
            alert("Error en la carga de Normas");
        },
    });


}
function _loadEditorialOpinion() {

    var ruta = '/Portal/_GetNoticiasEditorialOpinion';
    $.ajax({
        type: 'GET',
        url: ruta,
        contentType: JSON,
        processData: false,
        success: function (data) {
            var row = "";
            row += "";


            $.each(data, function (index, item) {
                if (index == 0) {
                    row += "<div class='editorial'>";
                    row += "<div class='card-panel grey lighten-4 z-depth-0 padding15 white-600 card-600  borderadius6 '>";
                    row += "<div class='card-content left-align'>";
                    row += "<p class='red-text tex-darken-4 fw600 marginbottom5'><a href='seccion.html' class='seccionrojo'>EDITORIAL</a></p>";
                    row += "<span class='card-title2'><a href='nota.html' class='grey-text text-darken-3'>" + item.vchTitulo + "</a></span>";
                    row += "<p class='truncate05 '><a href='nota.html' class='bajada grey-text text-darken-3'>" + item.vchDescripcion + "</a></p>";
                    row += "</div>";
                    row += "</div>";
                    row += "</div>";
                } else {
                    row += "<div class='opinion'>";
                    row += "<div class='card-panel grey lighten-4 z-depth-0 padding15 white-600 card-600  borderadius6 '>";
                    row += "<div class='card-content left-align'>";
                    row += "<p class='red-text tex-darken-4 fw600 marginbottom5'><a href='seccion.html' class='seccionrojo'>OPINION</a></p>";
                    row += "<span class='card-title2'><a href='nota.html' class='grey-text text-darken-3'>" + item.vchTitulo + "</a></span>";
                    row += "<p class='truncate05 '><a href='nota.html' class='bajada grey-text text-darken-3'>" + item.vchDescripcion + "</a></p>";
                    row += "</div>";
                    row += "</div>";
                    row += "</div>";
                }

            });



            $("#contenedoreditorial").html(row);

        },
        error: function () {
            alert("Error en la carga de Normas");
        },
    });


}