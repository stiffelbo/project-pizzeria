import { templates, select } from '../settings.js';
import AmountWidget from './AmountWidget.js'; //importowanie domyslne
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
    }

    render(element) {
        const thisBooking = this;
        /* generate html from tamplate */
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;

        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.date = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hour = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);

        //console.log(thisBooking.dom.peopleAmount);
        //console.log(thisBooking.dom.hoursAmount);

    }

    initWidgets() {
        const thisBooking = this;
        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dateWidget = new DatePicker(thisBooking.dom.date);
        thisBooking.hourWidget = new HourPicker(thisBooking.dom.hour);

        thisBooking.dom.peopleAmount.addEventListener('updated', function() {

        });
        thisBooking.dom.hoursAmount.addEventListener('updated', function() {

        });

    }
}

export default Booking;