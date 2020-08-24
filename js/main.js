var map, zoom, tabHeight;
var clusterer, curDate = new Date("3018-04-16");
var months = ['Послеюль', 'Солмат', 'Рете', 'Астрон', 'Тримидж', 'Передлит', 'Послелит', 'Вэдмат', 'Халимит', 'Винтерфилт', 'Бломат', 'Передюль'];
var time_running = false;
var speed = 1;

function getDistance(p1, p2)
{
    return Math.sqrt((p1[0] - p2[0])*(p1[0] - p2[0]) + (p1[1] - p2[1])*(p1[1] - p2[1]));
}

function draw_path(ch) {
    var chords = [];

    ch.movements.forEach(mov => {
        mov.points.forEach(pt => chords.push(pt))
    });
    var myGeoObject = new ymaps.GeoObject({
        geometry: {
            type: "LineString",
            coordinates: chords
        }
    }, {
        strokeColor: ch.color,
        // Ширина линии.
        strokeWidth: 5
    });
    ch.pathGeo = myGeoObject;
    map.geoObjects.add(ch.pathGeo);
}

function hide_path(ch) {
    ch.pathGeo.options.set({visible: false});
}

function show_path(ch) {
    ch.pathGeo.options.set({visible: true});
}

function hide_char(ch) {
    ch.placemark.options.set({visible: false});
    ch.hidden = true;
    new_time(curDate);
}

function show_char(ch) {
    ch.placemark.options.set({visible: true});
    ch.hidden = false;
    new_time(curDate);
}

function show_location(p){
    p.placemark.options.set({visible: true});
}

function hide_location(p){
    p.placemark.options.set({visible: false});
}

function createPreset(zoom){
    if(zoom <= 21) return 'islands#lightBlueCircleDotIcon';
    return 'islands#lightBlueStretchyIcon';
}

function createIconContent(zoom, content){
    if(zoom <= 21) return null;
    return content;
}

function createBalloonContent(zoom, content){
    if(zoom <= 21) return content;
    return null;
}

function tick_time() {
    if (time_running) {
        $("#slider-range").slider("value", $("#slider-range").slider("value") + 7200 * speed);
        correct_speed();
        window.requestAnimationFrame(function () {setTimeout(tick_time, 10)});
    }
}

function toggle_time() {
    if (time_running) {
        $("#toggle-time").get(0).innerHTML = "Запустить время";
        time_running = false;
    } else {
        $("#toggle-time").get(0).innerHTML = "Остановить время";
        time_running = true;
        tick_time();
    }
}

function correct_speed() {
    if (curDate.getTime() > 33108004800000) {
        speed = 0.125;
    } else {
        speed = 1;
    }
}

function init_slider()
{
    $("#slider-range").slider({
        range: false,
        min: new Date("3018-04-16").getTime() / 1000,
        max: new Date("3019-03-25").getTime() / 1000,
        value: curDate.getTime()/1000,
        slide: function( event, ui ) {
            var date = new Date(ui.value * 1000);
                       
            curDate = new Date(ui.value * 1000);
            new_time(curDate);
        },
        change: function( event, ui ) {
            var date = new Date(ui.value * 1000);
                       
            curDate = new Date(ui.value * 1000);
            new_time(curDate);
        },

    });
}

function new_time(date)
{
    $( "#cur-date" )[0].innerHTML = date.getFullYear() + " " + months[date.getMonth()] + "-" + date.getDate();

    characters.forEach(ch =>
    {
       
        if(ch.placemark == null)
        {
            ch.placemark =  new ymaps.Placemark([ch.movements[0].points[0][0], ch.movements[0].points[0][1]], {
                balloonContentHeader: ch.name,
                iconContent: ch.name,
                balloonContent: ''
            }, {
                preset: 'islands#darkOrangeStretchyIcon',
                visible: false
            });
        }
        map.geoObjects.remove(ch.placemark);
        for(var i = 0; i < ch.movements.length; i++)
        {
            var start = new Date(ch.movements[i].start);
            var end =  new Date(ch.movements[i].end);
            
            if(start.getTime() < date.getTime() &&  date.getTime() <=  end.getTime())
            {
                //изменение описания метки
                ch.placemark.properties.set({
                    balloonContentHeader: ch.name,
                    iconContent: ch.name,
                    balloonContent : ch.movements[i].description
                });


                var totalDist = 0;
                for(var j = 0; j < ch.movements[i].points.length - 1; j++)
                {
                    p1 = ch.movements[i].points[j];
                    p2 = ch.movements[i].points[j+1];
                    totalDist += getDistance(p1, p2);
                }
                
                var t1 = date.getTime() - start.getTime();
                var t2 = end.getTime() - start.getTime();
                var persents = t1 * 1.0 / t2;
                var dist = totalDist*persents;
                var curDist=0;
                
                for(var j = 0; j < ch.movements[i].points.length - 1; j++)
                {
                    p1 = ch.movements[i].points[j];
                    p2 = ch.movements[i].points[j+1];
                    prev =  curDist;
                    curDist += getDistance(p1, p2);
                    if(prev<=dist && dist<= curDist)
                    {
                        var a = dist - prev;
                        var b = curDist - prev;
                        var pers = a * 1.0 / b;
                        var x = p1[0] + (p2[0] - p1[0])*pers;
                        var y = p1[1] + (p2[1] - p1[1])*pers;
                    
                        ch.placemark.geometry.setCoordinates([x,y]);

                        map.geoObjects.add(ch.placemark);
                    }
                }
            }
        }
    });
    
    dateObj = new Date(date);
    events.forEach(e => {
        if (e.start < dateObj) {
            if (!$('.log[desc="' + e.event + '"]').length) {
                $('#event-log').append(`<div class="log" desc="${e.event}"><span class="date">${e.start.getFullYear() +" " + months[e.start.getMonth()] + "-" + e.start.getDate()}</span>: ${e.event}</div>`);
                var log_height = $($(".log").get(0)).height();
                if ($("#event-log").get(0).clientHeight < log_height * $("#event-log").children().length) {
                    $($(".log").get(0)).css("margin-top", "-" + (log_height * $("#event-log").children().length - $("#event-log").get(0).clientHeight + 5) + "px");
                }
            }
        } else if (e.start > dateObj) {
            if ($('.log[desc="' + e.event + '"]').length) {
                $('.log[desc="' + e.event + '"]').get(0).remove();
                var log_height = $($(".log").get(0)).height();
                if ($("#event-log").get(0).clientHeight < log_height * $("#event-log").children().length) {
                    $($(".log").get(0)).css("margin-top", "-" + (log_height * $("#event-log").children().length - $("#event-log").get(0).clientHeight + 5) + "px");
                }
            }
               
        }
    });
}

function init()
{
    var LAYER_NAME = 'user#layer',
    MAP_TYPE_NAME = 'user#customMap',
    TILES_PATH = 'images/tiles',


    MAX_ZOOM = 23,
    PIC_WIDTH = 8192, //,
    PIC_HEIGHT = 6144;//;

    
    var Layer = function () {
        var layer = new ymaps.Layer(TILES_PATH + '/%z/tile-%x-%y.jpg', {
            // Если есть необходимость показать собственное изображение в местах неподгрузившихся тайлов,
            // раскомментируйте эту строчку и укажите ссылку на изображение.
             notFoundTile: TILES_PATH+'/0/tile-0-0.jpg'
        });
        // Указываем доступный диапазон масштабов для данного слоя.
        layer.getZoomRange = function () {
            return ymaps.vow.resolve([1, 24]);
        };
        // Добавляем свои копирайты.
        layer.getCopyrights = function () {
            return ymaps.vow.resolve('©');
        };
        return layer;
    };
    // Добавляем в хранилище слоев свой конструктор.
    ymaps.layer.storage.add(LAYER_NAME, Layer);

    /**
     * Создадим новый тип карты.
     * MAP_TYPE_NAME - имя нового типа.
     * LAYER_NAME - ключ в хранилище слоев или функция конструктор.
     */
    var mapType = new ymaps.MapType(MAP_TYPE_NAME, [LAYER_NAME]);
    // Сохраняем тип в хранилище типов.
    ymaps.mapType.storage.add(MAP_TYPE_NAME, mapType);

    // Вычисляем размер всех тайлов на максимальном зуме.
    var worldSize = Math.pow(2, MAX_ZOOM) * 256;
        /**
         * Создаем карту, указав свой новый тип карты.
         */
    map = new ymaps.Map('map', {
        center: [0, 0],
        zoom: 19,
        controls: ['zoomControl'],
        type: MAP_TYPE_NAME
    }, {

        // Задаем в качестве проекции Декартову. При данном расчёте центр изображения будет лежать в координатах [0, 0].
        projection: new ymaps.projection.Cartesian([[PIC_HEIGHT / 2 - worldSize, -PIC_WIDTH / 2], [PIC_HEIGHT / 2, worldSize - PIC_WIDTH / 2]], [false, false]),
        // Устанавливаем область просмотра карты так, чтобы пользователь не смог выйти за пределы изображения.
        restrictMapArea: [[-PIC_HEIGHT, -PIC_WIDTH], [PIC_HEIGHT, PIC_WIDTH]]

        // При данном расчёте, в координатах [0, 0] будет находиться левый нижний угол изображения,
        // правый верхний будет находиться в координатах [PIC_HEIGHT, PIC_WIDTH].
        // projection: new ymaps.projection.Cartesian([[PIC_HEIGHT - worldSize, 0], [PIC_HEIGHT, worldSize]], [false, false]),
        // restrictMapArea: [[0, 0], [PIC_HEIGHT, PIC_WIDTH]]
    });

    zoom = map.getZoom();

    map.events.add('boundschange', function () {
        var currentZoom = map.getZoom();
        if (currentZoom != zoom) {
            zoom = currentZoom;
        }
        
        points.forEach(p => {
            if(zoom > 21){
                p.placemark.balloon.close();
            }
            p.placemark.options.set({
                preset: createPreset(zoom)
            });
            
            p.placemark.properties.set({
                iconContent: createIconContent(zoom, p.content),
                balloonContent: createBalloonContent(zoom, p.content)
            });
        });
    });

    map.events.add('mousemove', function (e) {
        var coords = e.get('coords');
        $("#log-x")[0].innerHTML = coords[0].toPrecision(6);
        $("#log-y")[0].innerHTML = coords[1].toPrecision(6);
    });

    points.forEach(p => {
        var point = new ymaps.Placemark(p.chords, {
            iconContent: createIconContent(zoom, p.content),
            balloonContent: createBalloonContent(zoom, p.content)
        }, {
            preset: createPreset(zoom)
        });
        map.geoObjects.add(point);
        p.placemark = point;
    });

    //добавление меток городов стран и тд
    map.events.add('click', function (e) {
        var coords = e.get('coords');
        $("#log-xy")[0].innerHTML = $("#log-xy")[0].innerHTML + "[" + coords[0].toPrecision(6) + ", " + coords[1].toPrecision(6) + "],";
    });

    //отображение путей героев
    characters.forEach(ch => draw_path(ch));
    
    curDate = new Date("3018-04-16");
    new_time(curDate);
    /*characters.forEach(ch => {
    show_path(ch)
    show_char(ch)
    });*/
   if ($("#show-paths-checkbox").get(0).checked) characters.forEach(ch => { if ($('.show-path-checkbox[char="' + ch.name + '"]').get(0).checked) show_path(ch); });
    if ($("#show-chars-checkbox").get(0).checked) characters.forEach(ch => { if ($('.show-char-checkbox[char="' + ch.name + '"]').get(0).checked) show_char(ch); });
}

$(function(){
    $(".js-example-basic-multiple").select2();
    characters.forEach(ch => {
        $("#tabs-2 > .tab-wrapper-inner").get(0).innerHTML += `<input type="checkbox" class="show-path-checkbox" char="${ch.name}" checked> <label>Показывать путь ${ch.name}</label><br>`;
        $("#tabs-3 > .tab-wrapper-inner").get(0).innerHTML += `<input type="checkbox" class="show-char-checkbox" char="${ch.name}" checked> <label>Показывать ${ch.name}</label><br>`;
    })
    tabHeight = $('#tabs-2').height();
    ymaps.ready(init);
    init_slider();
    $("#tabs").tabs();

    $("#show-paths-checkbox").on("change", function (e) {
        if ($("#show-paths-checkbox").get(0).checked) {
           characters.forEach(ch => { if ($('.show-path-checkbox[char="' + ch.name + '"]').get(0).checked) show_path(ch); });
        } else {
            characters.forEach(ch => hide_path(ch));
        } 
    });

    $("#show-chars-checkbox").on("change", function (e) {
        if ($("#show-chars-checkbox").get(0).checked) {
            characters.forEach(ch => { if ($('.show-char-checkbox[char="' + ch.name + '"]').get(0).checked) show_char(ch); });
        } else {
            characters.forEach(ch => hide_char(ch));
        } 
    });

    $("#show-locations-checkbox").on("change", function (e) {///////
        if ($("#show-locations-checkbox").get(0).checked) {
            points.forEach(p => show_location(p));
        } else {
            points.forEach(p => hide_location(p));
        } 
    });

    $(".show-path-checkbox").on("change", function (e) {
        characters.forEach(ch => {
            if (e.target.attributes.getNamedItem("char").value == ch.name) {
                if (e.target.checked) {
                    show_path(ch);
                } else {
                    hide_path(ch);
                }
            }
        });
    });

    $(".show-char-checkbox").on("change", function (e) {
        characters.forEach(ch => {
            if (e.target.attributes.getNamedItem("char").value == ch.name) {
                if (e.target.checked) {
                    show_char(ch)
                } else {
                    hide_char(ch);
                }
            }
        });
    });

    $("#slider-vertical").slider({
        orientation: "vertical",
        range: "min",
        min: 0,
        max: 100,
        value: 100,
        change: function( event, ui ) {
            $(".tab-wrapper-inner").css({"margin-top": "-" + (100 - ui.value) * (tabHeight / 100) + "px"})
        },
        slide: function( event, ui ) {
            $(".tab-wrapper-inner").css({"margin-top": "-" + (100 - ui.value) * (tabHeight / 100) + "px"})
        }
    });

    $("#tabs").on("wheel", function (e) {
        e.preventDefault();

        $("#slider-vertical").slider("value", $("#slider-vertical").slider("value") + e.originalEvent.deltaY / Math.abs(e.originalEvent.deltaY) * -2)
    });

    $("#event-log").on("wheel", function (e) {
        e.preventDefault();
        if ($(".log").length > 0) {
            var mrg;
            if ($($(".log").get(0)).css("margin-top"))
                mrg = $($(".log").get(0)).css("margin-top").slice(0, $($(".log").get(0)).css("margin-top").length - 2) - 0; // "-0" - лучший способ преобразовать строку в число
            else
                mrg = 0;
            if (mrg + e.originalEvent.deltaY / Math.abs(e.originalEvent.deltaY) * -15 <= 0)
                $($(".log").get(0)).css("margin-top", (mrg + e.originalEvent.deltaY / Math.abs(e.originalEvent.deltaY) * -15) + "px");
            else
                $($(".log").get(0)).css("margin-top", "0px");
        }
    });
});
