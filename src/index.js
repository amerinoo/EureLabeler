var values_mem;
document.getElementById('btnLoad').addEventListener('click', () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = e => {
        var file = e.target.files[0];
        filename = file.name.split(".")[0];
        console.log("Loading file", this.filename)
        loadSettings();
        loadData();
        loadRegions();
    }
    input.click();
})

function loadSettings() {
    d3.csv("csvs/settings/" + filename + "-settings.csv").then(function (rs) {
        rs.forEach(s => {
            console.log(s)
            addMenuItem(s)
        });
        document.getElementById('dropdown-menu-items').children[0].click()
    }).catch((error) => {
        console.log("Settigns file not found!")
        seed = 1;
        for (i = 1; i <= 10; i++) {
            addMenuItem({ regionName: `Region_${i}`, regionClass: `Region_${i}`, colorHEX: getRandomColor() })
        }
        document.getElementById('dropdown-menu-items').children[0].click()
    });


}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.abs(Math.floor(Math.sin(seed++) * 15))];
    }
    console.log(color)
    return color;
}

function addMenuItem(settings) {
    var item = document.createElement("button");
    item.className = 'dropdown-item';
    item.type = 'button';

    item.innerHTML = settings.regionName;
    item.onclick = function () {
        regionSettings = settings;
        document.getElementById('dropdownMenu2').innerText = item.innerHTML;

    };
    document.getElementById('dropdown-menu-items').appendChild(item)

    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `.c3-region.${settings.regionName} { fill: ${settings.colorHEX}; }`;
    document.getElementsByTagName('head')[0].appendChild(style);
}

function loadRegions() {

    const myNode = document.getElementById('dropdown-menu-items');
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }
    d3.csv("csvs/regions/" + filename + "-regions.csv").then(function (rs) {
        rs.forEach(r => {
            r.start = new Date(r.start)
            r.end = new Date(r.end)
            this.regions.push(r)
        });
        chart.flush();
    }).catch((error) => {
        console.log("Regions file not found!")
    });
}

function loadData() {
    d3.csv("csvs/" + filename + ".csv").then((data) => {
        this.slice = 200;
        this.low = 0;
        this.high = this.slice * 5;
        this.dates_mem = [];
        this.values_mem = [];
        this.regions = [];
        data.forEach(element => {
            if (element.row_date.length != 0) {
                this.dates_mem.push(element.row_date);
                this.values_mem.push(parseFloat(element.value));
            }
        });

        createChart();
    });
}


function createChart() {
    slicing();
    chart = c3.generate({
        bindto: '#chart',
        data: {
            x: 'x',
            xFormat: '%d-%m-%y %H:%M',  // https://github.com/d3/d3-time-format/blob/master/README.md#locale_format
            columns: [this.dates, this.values],
            type: 'spline'
        },
        regions: this.regions,
        axis: {
            x: {
                type: 'timeseries'
            }
        },
        subchart: { show: true },
        zoom: { enabled: true },
    });
}

function isActiveChart() { return values_mem === undefined }

document.getElementById('btnPlus').addEventListener('click', () => {
    updateSlice(this.slice);
})

document.getElementById('btnMinus').addEventListener('click', () => {
    updateSlice(-this.slice);
})

function updateSlice(slice) {
    if (isActiveChart()) return;

    this.low += slice;
    this.high += slice;

    this.low = Math.max(this.low, 0)
    this.high = Math.min(this.high, values_mem.length)

    if (this.high == values_mem.length) {
        this.low = Math.max(this.low - slice, 0)
    }

    if (this.low == 0) {
        this.high = Math.min(values_mem.length, 1000)
    }

    updateChart()
}

function slicing() {
    console.log(`low: ${this.low} high: ${this.high}`)
    this.dates = ['x'].concat(dates_mem.slice(this.low, this.high))
    this.values = ['data1'].concat(values_mem.slice(this.low, this.high))

    console.log(this.dates);
    console.log(this.values);
}

function updateChart() {
    slicing();
    chart.load({ columns: [this.dates, this.values] });
}

document.getElementById('btnAddRegion').addEventListener('click', () => {
    addRegion();
})

function addRegion() {
    if (isActiveChart()) return;
    console.log(this.chart.zoom())

    this.regions.push(
        { axis: 'x', start: chart.zoom()[0], end: chart.zoom()[1], label: regionSettings.regionName, class: regionSettings.regionClass }
    )

    chart.flush();
}

document.getElementById('btnExport').addEventListener('click', () => {
    if (isActiveChart()) return;
    const csvLines = ["axis,start,end,label,class"];
    regions.forEach(region => {
        csvLines.push(`${region.axis},${region.start},${region.end},${region.label},${region.class}`)
    });

    const link = document.createElement('a');
    link.setAttribute('download', `${this.filename}-regions.csv`);
    link.setAttribute('href', encodeURI(`data:text/csv;charset=utf-8,${csvLines.join('\n')}`));
    link.click();
})

document.addEventListener('keydown', (event) => {
    console.log(event.keyCode, event.key)
    if (isActiveChart()) return;
    if ([107, 187].includes(event.keyCode)) {
        updateSlice(this.slice);
    } else if ([109, 189].includes(event.keyCode)) {
        updateSlice(-this.slice);
    } else if (event.keyCode === 77) {
        addRegion();
    }
});
