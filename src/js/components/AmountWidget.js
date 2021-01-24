import { select, settings } from '../settings.js';
import BaseWidget from './BaseWidget.js';

class AmountWidget extends BaseWidget {
    constructor(element) {
        //init base class constructor
        //przekazanie na dzien dobry do widżetu sztywnej wartości z settings
        //przywraca błąd wyświetlania niepoprawnej ilosći w koszyku oraz przeskakiwania wartości od defaulta a nie od tej przekazanej z Product
        super(element, settings.amountWidget.defaultValue);
        const thisWidget = this;

        thisWidget.getElements(element);
        thisWidget.initActions();
        //update widget value if not the same as in input, simple compare
        /*
        if (thisWidget.input.value != thisWidget.value) {
            thisWidget.value = parseInt(thisWidget.input.value);
        }
        */
    }

    getElements() {
        const thisWidget = this;

        thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.amount.input);
        thisWidget.dom.linkIncrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkIncrease);
        thisWidget.dom.linkDecrease = thisWidget.dom.wrapper.querySelector(select.widgets.amount.linkDecrease);
    }

    //overwrite method from base class
    isValid(value) {
        return !isNaN(value) &&
            value >= settings.amountWidget.defaultMin &&
            value <= settings.amountWidget.defaultMax;
    }

    //overwrite method from base class
    renderValue() {
        const thisWidget = this;
        thisWidget.dom.input.value = thisWidget.value;
    }

    initActions() {
        const thisWidget = this;
        thisWidget.dom.input.addEventListener('change', function() {
            thisWidget.setValue(thisWidget.dom.input.value);
        });
        thisWidget.dom.linkDecrease.addEventListener('click', function(event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value - 1);

        });
        thisWidget.dom.linkIncrease.addEventListener('click', function(event) {
            event.preventDefault();
            thisWidget.setValue(thisWidget.value + 1);
        });
    }

}

export default AmountWidget;