class BaseWidget {
    constructor(wrapperElement, initialValue) {
        const thisWidget = this;
        //create empty prop for dom elements
        thisWidget.dom = {};
        //add widget wraper DOM
        thisWidget.dom.wrapper = wrapperElement;
        //set widget correct value to agument value
        thisWidget.correctValue = initialValue;
    }

    //getter returns widget correct value

    get value() {
        const thisWidget = this;

        return thisWidget.correctValue;
    }

    //setter 
    set value(value) {
        const thisWidget = this;
        //convert argument value to INT
        const newValue = thisWidget.parseValue(value);
        //check if parsed argument value is different from widget correct value
        const isNewValue = thisWidget.correctValue != newValue;
        //if new value and argument value is number or string that is number
        if (isNewValue && thisWidget.isValid(value)) {
            //change correct value to this value
            thisWidget.correctValue = newValue;
            //send information thry custom event
            thisWidget.announce();
        }

        thisWidget.renderValue();
        thisWidget.announce();
    }

    setValue(value) {
        const thisWidget = this;

        thisWidget.value = value;
    }

    parseValue(value) {
        return parseInt(value);
    }

    isValid(value) {
        return !isNaN(value);
    }

    renderValue() {
        const thisWidget = this;
        thisWidget.dom.wrapper.innerHTML = thisWidget.value;
    }

    announce() {
        const thisWidget = this;

        const event = new CustomEvent('updated', {
            bubbles: true,
            detail: { classes: thisWidget.dom.wrapper.classList }
        });
        thisWidget.dom.wrapper.dispatchEvent(event);
    }
}

export default BaseWidget;