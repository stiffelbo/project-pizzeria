import { select, settings } from '../settings.js';

class AmountWidget {
    constructor(element) {
        const thisWidget = this;
        thisWidget.value = settings.amountWidget.defaultValue; //dane pobieram z objektu settings
        //przez to w koszyku po kliknięciu w +- wartość licozna jest od 1.
        //powinna byc zczytywana z domu lub z obiektu.
        thisWidget.getElements(element);
        thisWidget.initActions();
        //update widget value if not the same as in input, simple compare

        if (thisWidget.input.value != thisWidget.value) {
            thisWidget.value = parseInt(thisWidget.input.value);
        }

        //console.log('AmountWidget ', thisWidget);
        //console.log('constructor arguments:', element);
        //console.log("initial value ", thisWidget.value);
    }

    getElements(element) {
        const thisWidget = this;

        thisWidget.element = element;
        thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
        thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
        thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
    }

    setValue(value) {
        const thisWidget = this;
        const newValue = parseInt(value);
        //TODO: Add validation
        const isNewValue = thisWidget.value !== newValue && !isNaN(newValue);
        if (isNewValue && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
            thisWidget.value = newValue;
            thisWidget.announce();
        }
        thisWidget.input.value = thisWidget.value;
        thisWidget.announce();
    }

    initActions() {
        const thisWidget = this;
        thisWidget.input.addEventListener('change', function() {
            thisWidget.setValue(thisWidget.input.value);
            console.log('Amount widget: change', thisWidget.input.value);
        });
        thisWidget.linkDecrease.addEventListener('click', function(event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value - 1);

        });
        thisWidget.linkIncrease.addEventListener('click', function(event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value + 1);
        });
    }

    announce() {
        const thisWidget = this;

        const event = new CustomEvent('updated', {
            bubbles: true
        });
        thisWidget.element.dispatchEvent(event);
    }
}

export default AmountWidget;