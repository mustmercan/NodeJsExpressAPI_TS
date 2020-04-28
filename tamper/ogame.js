// ==UserScript==
// @name         OgameConsole
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  OgameConsole
// @author       MM
// @grant        none

// ==/UserScript==

var techIDs = {
    1: "Metal Madeni",
    2: "Kristal Madeni",
    3: "Deuterium Sentezleyicisi",
    4: "Solar Enerji Santrali",
    12: "Füzyoenerji Santrali",
    14: "Robot Fabrikasi",
    15: "Nanit Fabrikasi",
    21: "Uzay Tersanesi",
    22: "Metal Deposu",
    23: "Kristal Deposu",
    24: "Deuterium Tankeri",
    25: "Korunmus metal korunak",
    26: "Yeralti Kristal Korunagi",
    27: "Deniz Dibi Deuterium Korunagi",
    31: "Bilimsel Arastirma Laboratuvari",
    33: "Terraformer",
    34: "Ittifak Deposu",
    41: "Ay Merkez Istasyonu",
    42: "Radar Istasyonu",
    43: "Siçrama Geçidi",
    44: "Roket Silosu",
    106: "Casusluk Teknigi",
    108: "Bilgisayar Teknigi",
    109: "Silah Teknigi",
    110: "Koruyucu Kalkan Teknigi",
    111: "Uzay Gemisi Zirhlandirmasi",
    113: "Enerji Teknigi",
    114: "Hiperuzay Teknigi",
    115: "Yanmali Motor Takimi",
    117: "Impuls Motortakimi",
    118: "Hiperuzay Iticisi",
    120: "Lazer Teknigi",
    121: "Iyon Teknigi",
    122: "Plazma Teknigi",
    123: "Galaksiler arasi arastirma agi",
    124: "Astrofizik",
    199: "Gravitasyon Arastirmasi",
    202: "Küçük Nakliye Gemisi",
    203: "Büyük Nakliye Gemisi",
    204: "Hafif Avci",
    205: "Agir Avci",
    206: "Kruvazör",
    207: "Komuta Gemisi",
    208: "Koloni Gemisi",
    209: "Geri Dönüsümcü",
    210: "Casus Sondasi",
    211: "Bombardiman Gemisi",
    212: "Solar Uydu",
    213: "Muhrip",
    214: "Ölüm Yildizi",
    215: "Firkateyn",
    401: "Roketatar",
    402: "Hafif Lazer Topu",
    403: "Agir Lazer Topu",
    404: "Gaus Topu",
    405: "Iyon Topu",
    406: "Plazma Atici",
    407: "Küçük Kalkan Kubbesi",
    408: "Büyük Kalkan Kubbesi",
    502: "Yakaliyici Roketler",
    503: "Gezegenlerarasi Roketler"
}
var $ = window.jQuery;
var resource;
var setPlanetMoveInProgress = (val) => { window.planetMoveInProgress = val };
var getPlanetMoveInProgress = () => window.planetMoveInProgress;
(function () {
    window.oldReloadResources = window.reloadResources;
    window.reloadResources =
        (data, callback) => {
            let event = new CustomEvent('ReloadResources', {
                bubbles: true,
                detail: { data: data, callback, callback }
            });
            document.body.dispatchEvent(event);
            resource = data;
            console.log(data);
            window.oldReloadResources(data, callback);
        };
    $ = window.jQuery;
}

)();
var resourceLocalUpdateTimer, resourceLocal;


var addUpgradeOrderButton = (body, requestPage) => {
    let datas = [];
    $(body).find(".technology").each((index, element) => {

        var data = {
            techId: $(element).data("technology") * 1,
            status: $(element).data("status"),
            level: $(element).find(".level").data("value") * 1,
            upgradeLink: $(element).find(".upgrade").data("target"),
            page: requestPage ? requestPage : window.location.href,
            finish: false,
            startDate: undefined,
            endDate: undefined
        }
        datas[data.techId] = data;
        $(element).append(`<button class="addOrder" style="position: absolute;top: 0;right: 0;z-index: 99999999999;" id="tech${data.techId}" data-json='${JSON.stringify(data)}'>+</button>`);
    });

    $("button.addOrder").on("click", (e) => { addUpgradeOrder($(e.target).data("json")) })
    return datas;


}

var addUpgradeOrder = (data) => {
    let orders = getLocalStorage("upgradeOrder");
    if (!orders) {
        orders = [];
    }
    orders.push(data);
    setLocalStorage("upgradeOrder", orders);
    console.log(orders);
    updateUpgradeList();
}
var updateUpgradeList = () => {
    $("li#upgradeList").html("");
    var orders = getLocalStorage("upgradeOrder");
    if (orders) {
        orders.forEach((order, index) => {
            $("li#upgradeList").append(`<ul style="background-color:${order.finish ? "green" : order.endDate ? "yellow" : "none"}">${getTechName(order.techId)} L:${order.level} F:${order.finish} S:${order.status}  <button class="orderDelete" data-index="${index}">-</button></ul>`)
        });

        if (orders.length > 0) {
            $("li#upgradeList").append(`<button class="orderButton">İşle</button>`)
        }

        $("button.orderDelete").on("click", (e) => { deleteUpgradeOrder($(e.target).data("index")) });
        $("button.orderButton").on("click", (e) => { removeLocalStorage("runUpgrade"); setLocalStorage("startOrder", true); upgradeOrderOperation($(e.target), 0) });
    }
}
var deleteUpgradeOrder = (index) => {
    var orders = getLocalStorage("upgradeOrder");
    if (orders && orders.length > 1) {
        orders.splice(index, 1);
        setLocalStorage("upgradeOrder", orders);
        updateUpgradeList();
    }
    else {
        setLocalStorage("upgradeOrder", []);
        updateUpgradeList();
    }

}

var upgradeOrderOperation = async (button, i) => {
    var orders = getLocalStorage("upgradeOrder");

    i = i == undefined ? 0 : i;
    if (i >= orders.length) {
        removeLocalStorage("startOrder");
        window.clearInterval(window.upgradeCheckTimer);
        window.upgradeCheckTimer = undefined;

        return false;
    }


    let order = orders[i];
    if (!order.finish) {
        getTechDetail(order.techId).then((detail) => {

            if (!detail.disabled && detail.available && order.startDate == undefined) {



                updateUpgradeData(order.page, order.techId).then((data) => {
                    if (data) {
                        order = data;
                        order.startDate = new Date() * 1;
                        order.endDate = new Date(new Date() * 1 + detail.time.d * 24 * 60 * 60 * 1000 + detail.time.h * 60 * 60 * 1000 + detail.time.m * 60 * 1000 + (detail.time.s + 5) * 1000) * 1;
                        order.finish = false;
                        orders[i] = order;
                        setLocalStorage("upgradeOrder", orders);
                        setLocalStorage("runUpgrade", { index: i, order: order });
                        console.log("State Update", order);
                        //debugger;
                        window.location.href = order.upgradeLink;
                    }



                })


            }

            else {
                //debugger;

                console.log(`wait upgrade ${getTechName(order.techId)}`, order);
                if (window.upgradeCheckTimer == undefined && !getLocalStorage("runUpgrade") && !getLocalStorage("autoReload")) {
                    let timertick = getRndInteger(1, 5) * 60 * 1000;
                    console.log(`Timer Interval ${timertick / 60 / 1000}`);
                    window.upgradeCheckTimer = window.setInterval(() => {
                        console.log(`upgradeCheckTimer Tick:Tech:order.techId(${getTechName(order.techId)})`);
                        upgradeOrderOperation();
                    }, timertick);
                }
                else if(!getLocalStorage("runUpgrade") && !window.reloadTimer)
                {
                    $("input#autoReload").trigger("change");//çalışan geliştirme var iken işaretlendiğinde
                }

            }





        })
    }
    else {
        upgradeOrderOperation(button, i + 1);
    }

}

var updateUpgradeData = async (page, techId) => {
    return new Promise((resolve) => {
        $.ajax({ url: page, type: "GET", contentType: "text/html; charset=utf-8" }).done((data) => {
            if (data) {
                var datas = addUpgradeOrderButton(data, page);
                resolve(datas[techId])
            }
            resolve(undefined);

        })
    });
}


var getTechName = (techId) => {
    return techIDs[techId * 1];
}

var checkRunUpgrade = () => {
    let r = getLocalStorage("runUpgrade");
    if (r) {
        var orders = getLocalStorage("upgradeOrder");
        var order = orders[r.index];
        if (order) {
            if (new Date(r.order.endDate) < new Date()) {
                order.finish = true;
                setLocalStorage("upgradeOrder", orders);
                console.log("update complte");
                removeLocalStorage("runUpgrade");
                window.clearInterval(window.upgradeTimer);
                window.upgradeTimer = undefined;
                upgradeOrderOperation();
            }
            else {
                if (window.upgradeTimer == undefined) {
                    window.upgradeTimer = window.setInterval(() => {
                        console.log(`Upadte Tick: ${getTechName(order.techId)} e:${(new Date(r.order.endDate) - new Date()) / 1000}`);
                        checkRunUpgrade();
                    }, 1000);
                }

            }
        }
        else {
            removeLocalStorage("runUpgrade");
            window.clearInterval(window.upgradeTimer);
            window.clearInterval(window.upgradeCheckTimer);
            window.upgradeCheckTimer = undefined;
            window.upgradeTimer = undefined;
        }
        updateUpgradeList();
        return true;
    }
    else {
        window.clearInterval(window.upgradeTimer);
        window.upgradeTimer = undefined;
        console.log("no upgrade");
        updateUpgradeList();
    }
    return false;
}

var getTechDetail = async (techId) => {

    return new Promise((resolve) => {
        let detailLink = `/game/index.php?page=ingame&component=technologydetails&ajax=1&ajax=1&action=getDetails&technology=${techId}`;

        $.ajax({ url: detailLink, type: "GET", contentType: "application/json; charset=utf-8" }).done((data) => {
            data = JSON.parse(data);
            if (data && data.content && data.content.technologydetails) {
                let detail = {
                    metal: { value: 0, available: true },
                    crystal: { value: 0, available: true },
                    deuterium: { value: 0, available: true },
                    time: { d: 0, h: 0, m: 0, s: 0 },
                    available: true,
                    disabled: true
                }
                let dateTime = $(data.content.technologydetails).find(".build_duration .value").attr("datetime");
                if (dateTime) {
                    let sIndex = dateTime.indexOf("S");
                    let mIndex = dateTime.indexOf("M");
                    let hIndex = dateTime.indexOf("H");
                    let dIndex = dateTime.indexOf("D");
                    detail.time.d = dIndex > -1 ? dateTime.substr(2, dIndex - 2) * 1 : 0;
                    dIndex = (dIndex > -1 ? dIndex + 1 : 2);
                    detail.time.h = hIndex > -1 ? dateTime.substr(dIndex, hIndex - dIndex) * 1 : 0;
                    hIndex = (hIndex > -1 ? hIndex + 1 : 2);
                    detail.time.m = mIndex > -1 ? dateTime.substr(hIndex, mIndex - hIndex) * 1 : 0;
                    mIndex = (mIndex > -1 ? mIndex + 1 : 2);
                    detail.time.s = sIndex > -1 ? dateTime.substr(mIndex, sIndex - mIndex) * 1 : 0;
                }
                console.log(dateTime, detail.time);
                let costs = $(data.content.technologydetails).find("div.costs").find("li");
                costs.each((costLi) => {
                    if ($(costLi).hasClass("metal")) {
                        detail.metal.value = $(costLi).data("value");
                        detail.metal.available = $(costLi).hasClass("sufficient");
                        detail.available &= detail.metal.available
                    }
                    else if ($(costLi).hasClass("crystal")) {
                        detail.crystal.value = $(costLi).data("value");
                        detail.crystal.available = $(costLi).hasClass("sufficient");
                        detail.crystal &= detail.metal.available

                    }
                    else if ($(costLi).hasClass("deuterium")) {
                        detail.deuterium.value = $(costLi).data("value");
                        detail.deuterium.available = $(costLi).hasClass("sufficient");
                        detail.deuterium &= detail.metal.available

                    }

                });
                let disabledButton = $(data.content.technologydetails).find("div.build-it_wrap button");
                let disabled = disabledButton.attr("disabled");
                detail.disabled = (disabledButton == undefined || disabledButton.length == 0) || !(disabled == undefined || disabled == "");

                resolve(detail);
            }
            resolve(undefined);
        });

    });


}

var updateResource = (data) => {

    $("#OgameConsole #metal #mevcut").html(data.metal.amount.toFixed(3));
    $("#OgameConsole #metal #depo").html(`${data.functions.storageLeft(data.metal).toFixed(3)}/${data.metal.storage.toFixed(3)}`);
    $("#OgameConsole #metal #uretim").html(`DK:${data.functions.productionState(data.metal).minute.toFixed(3)} SA:${data.functions.productionState(data.metal).hour.toFixed(3)}`);

    $("#OgameConsole #kristal #mevcut").html(data.crystal.amount.toFixed(3));
    $("#OgameConsole #kristal #depo").html(`${data.functions.storageLeft(data.crystal).toFixed(3)}/${data.crystal.storage.toFixed(3)}`);
    $("#OgameConsole #kristal #uretim").html(`DK:${data.functions.productionState(data.crystal).minute.toFixed(3)} SA:${data.functions.productionState(data.crystal).hour.toFixed(3)}`);

    $("#OgameConsole #deuterium #mevcut").html(data.deuterium.amount.toFixed(3));
    $("#OgameConsole #deuterium #depo").html(`${data.functions.storageLeft(data.deuterium).toFixed(3)}/${data.deuterium.storage.toFixed(3)}`);
    $("#OgameConsole #deuterium #uretim").html(`DK:${data.functions.productionState(data.deuterium).minute.toFixed(3)} SA:${data.functions.productionState(data.deuterium).hour.toFixed(3)}`);

    $("#OgameConsole #enerji #mevcut").html(data.energy.amount.toFixed(3));
    $("#OgameConsole #enerji #uretim").html(`DK:${data.functions.productionState(data.energy).minute.toFixed(3)} SA:${data.functions.productionState(data.energy).hour.toFixed(3)}`);


}
var calculateResource = (data) => {
    if (!data) {
        console.log("data not found")
    }
    let result = {
        functions:
        {
            storageLeft: (r) => { return (r.storage - r.amount) },
            productionState: (r) => {
                let sec = (r.production - r.consumption);
                return {
                    second: sec,
                    minute: sec * 60,
                    hour: sec * 60 * 60,
                    day: sec * 60 * 60 * 24
                }
            }
        },
        metal: {
            amount: data.resources.metal.amount,
            storage: data.resources.metal.storage,
            consumption: 0,
            consumptionTechs: [],
            production: 0,
            productionTechs: [],
        },
        deuterium:
        {
            amount: data.resources.deuterium.amount,
            storage: data.resources.deuterium.storage,
            consumption: 0,
            consumptionTechs: [],
            production: 0,
            productionTechs: [],
        },
        crystal: {
            amount: data.resources.crystal.amount,
            storage: data.resources.crystal.storage,
            consumption: 0,
            consumptionTechs: [],
            production: 0,
            productionTechs: []
        },
        energy: {
            amount: data.resources.energy.amount,
            consumption: 0,
            consumptionTechs: [],
            production: 0,
            productionTechs: [],
        }

    };
    Object.keys(data.techs).forEach(key => {
        let tech = data.techs[key];

        result.metal.consumption += tech.consumption.metal;
        tech.consumption.metal > 0 ? result.metal.consumptionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.consumption.metal }) : result.metal.consumptionTechs;
        result.metal.production += tech.production.metal;
        tech.production.metal > 0 ? result.metal.productionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.production.metal }) : result.metal.productionTechs;

        result.crystal.consumption += tech.consumption.crystal;
        tech.consumption.crystal > 0 ? result.crystal.consumptionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.consumption.crystal }) : result.crystal.consumptionTechs;
        result.crystal.production += tech.production.crystal;
        tech.production.crystal > 0 ? result.crystal.productionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.production.crystal }) : result.crystal.productionTechs;

        result.deuterium.consumption += tech.consumption.deuterium;
        tech.consumption.deuterium > 0 ? result.deuterium.consumptionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.consumption.deuterium }) : result.deuterium.consumptionTechs;
        result.deuterium.production += tech.production.deuterium;
        tech.production.deuterium > 0 ? result.deuterium.productionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.production.deuterium }) : result.deuterium.productionTechs;

        result.energy.consumption += tech.consumption.energy;
        tech.consumption.energy > 0 ? result.energy.consumptionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.consumption.energy }) : result.energy.consumptionTechs;
        result.energy.production += tech.production.energy;
        tech.production.energy > 0 ? result.energy.productionTechs.push({ techName: getTechName(tech.techId), techId: tech.techId, value: tech.production.energy }) : result.energy.productionTechs;

    });

    console.log("Resource", result);
    return result;

}

var getLocalStorage = (key) => {
    return window.localStorage.getItem(key) && window.localStorage.getItem(key) != "undefined" ? JSON.parse(window.localStorage.getItem(key)) : undefined;
}

var setLocalStorage = (key, data) => {
    return window.localStorage.setItem(key, JSON.stringify(data))
}

var removeLocalStorage = (key) => {
    return (window.localStorage.removeItem(key))
}

var generateLeftMenu = () => {
    let menu = $("body").append(`<div id="OgameConsole" style="background-color: #657777;position: fixed;right: 0px;top: 60px;max-height: 500px;overflow: auto;">
    <p>Metal</p>
    <li id="metal">
        <ul>Mevcut:<span id="mevcut">0</span></ul>
        <ul>Üretim:<span id="uretim">0</span></ul>
        <ul>Depo:<span id="depo">0</span></ul>
    </li>
    <p>Kristal</p>
    <li id="kristal">
        <ul>Mevcut:<span id="mevcut">0</span></ul>
        <ul>Üretim:<span id="uretim">0</span></ul>
        <ul>Depo:<span id="depo">0</span></ul>
    </li>
    <p>Deuterium </p>
    <li id="deuterium">
        <ul>Mevcut:<span id="mevcut">0</span></ul>
        <ul>Üretim:<span id="uretim">0</span></ul>
        <ul>Depo:<span id="depo">0</span></ul>
    </li>
    <p>Enerji</p>
    <li id="enerji">
        <ul>Mevcut:<span id="mevcut">0</span></ul>
        <ul>Üretim:<span id="uretim">0</span></ul>
    </li>
    <input id="autoReload" type="checkbox" name="vehicle1" value="reload"> Sayfayı Yeniden Yükle<br>
    <div id="upgradeDiv">
        <p>Geliştirmeler</p>
        <li id="upgradeList">

        </li>
    </div>
</div>`);


    $("input#autoReload").on("change", () => {
        let checked = $("input#autoReload").prop("checked");
        setLocalStorage("autoReload", checked);
        if (checked && !getLocalStorage("runUpgrade")) {
            window.clearInterval(window.upgradeCheckTimer);
            window.upgradeCheckTimer = undefined;
            if (!window.reloadTimer) {
                let r = getRndInteger(1, 10) * getRndInteger(50, 60) * 1000;
                console.log(`Reload Timer:${Math.round(r / 1000 / 60)}`)
                window.reloadTimer = window.setInterval(() => { window.redirectOverview(); }, r)
            }
        }
        else {
            window.clearInterval(window.reloadTimer);
            window.reloadTimer = undefined;
            checkRunUpgrade();
        }

    });
    $("input#autoReload").prop("checked", getLocalStorage("autoReload"));

    return menu;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

$(() => {
    var leftMenu = generateLeftMenu();
    resourceLocalUpdateTimer = window.setInterval(() => {
        if (!resourceLocal && resource) {
            resourceLocal = calculateResource(resource);
        }
        resourceLocal.metal.amount += resourceLocal.functions.productionState(resourceLocal.metal).second;
        resourceLocal.crystal.amount += resourceLocal.functions.productionState(resourceLocal.crystal).second;
        resourceLocal.deuterium.amount += resourceLocal.functions.productionState(resourceLocal.deuterium).second;
        resourceLocal.energy.amount += resourceLocal.functions.productionState(resourceLocal.energy).second;
        updateResource(resourceLocal);
    }, 1000);
    addUpgradeOrderButton(document.body);
    updateUpgradeList();
    checkRunUpgrade();
    if (getLocalStorage("startOrder")) {
        console.log("Resume Operation")
        upgradeOrderOperation();
    }

    $("body").on("ReloadResources", (detail) => {
        resource = detail.data;
        resourceLocal = calculateResource(resource);
    })





})