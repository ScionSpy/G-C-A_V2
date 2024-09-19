const QuickChart = require('quickchart-js');


module.exports = class Chart {
    labels = [];
    Datasets = [];

    /**
     *
     * @param {Object} options
     * @param {String} options.type
     * @param {String} options.title
     */
    constructor(options = {}) {
        if (!options.type || typeof options.type !== "string") throw new Error(`Structures.Chart(options); {options.type} must be defined as a string! got ${typeof options.type} : ${options.type}`);
        if (!options.title || typeof options.title !== "string") throw new Error(`Structures.Chart(options); {options.title} must be defined as a string! got ${typeof options.title} : ${options.title}`);

        this.type = options.type;
        this.title = options.title;
    };

    async save(options = {}){
        let chart = new QuickChart();

        if(this.title) options.title = { display: true, text: this.title };

        await chart.setConfig({
            type: this.type,
            data: {
                labels: this.labels,
                datasets: this.Datasets
            },
            options
        })
        .setWidth(1600)
        .setHeight(400);

        return chart.getShortUrl();
    };

    /**
     *
     * @param {String} label
     */
    addLabel(label){
        if (!label || typeof label !== "string") throw new Error(`Structures.Chart.addLabel(label); {label} must be defined as a string! got ${typeof label} : ${label}`);
        this.labels.push(label);
    };


    addDataset(options = {}){
        if(!options.label || typeof options.label !== "string") throw new Error(`Structures.Chart.addDataset(options); {options.label} must be defined as a string! got ${typeof options.label} : ${options.label}`);
        if (options.fill && typeof options.fill !== "boolean") throw new Error(`Structures.Chart.addDataset(options); {options.fill} must be a boolean, got ${typeof options.fill}`);
        if (options.color && typeof options.color !== "string") throw new Error(`Structures.Chart.addDataset(options); {options.color} must be a string, got ${typeof options.color}: ${options.color}`);
        if (options.backgroundColor && typeof options.backgroundColor !== "string") throw new Error(`Structures.Chart.addDataset(options); {options.backgroundColor} must be a string, got ${typeof options.backgroundColor}: ${options.backgroundColor}`);
        if (options.type && typeof options.type !== "string") throw new Error(`Structures.Chart.addDataset(options); {options.type} must be defined as a string! got ${typeof options.type} : ${options.type}`);
        if (options.linetension && typeof options.linetension !== "number") throw new Error(`Structures.Chart.addDataset(options); {options.linetension} must be defined as a number! got ${typeof options.linetension} : ${options.linetension}`);

        let dataset = {
            label: options.label,
            data: options.data || [],
            fill: options.fill,
            borderColor: options.color || "eafe56",
            backgroundColor: options.backgroundColor || options.color || "00aaFF",
        };

        if (options.type) dataset.type = options.type;
        if (options.tlinetensionpe) dataset.linetension = options.linetension;

        this.Datasets.push(dataset);
    };
};
