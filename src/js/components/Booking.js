import { templates, select, settings } from '../settings.js';
import AmountWidget from './AmountWidget.js'; //importowanie domyslne
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
    constructor(element) {
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
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

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        if (typeof thisBooking.booked[date][startHour] == 'undefined') {
            thisBooking.booked[date][startHour] = [];
        }
        thisBooking.booked[date][startHour].push(table);

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            //check if reservation is not made after closing hour
            if (hourBlock < settings.hours.close) {
                //check if there are any reservations on hourBlock
                if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                    thisBooking.booked[date][hourBlock] = [];
                }
                thisBooking.booked[date][hourBlock].push(table);
            }
        }
    }

    parseData(bookings, eventsCurrent, eventsRepeat) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.dateWidget.minDate;
        const maxDate = thisBooking.dateWidget.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        //console.log('thisBooking.booked: ', thisBooking.booked);
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.dateWidget.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.dateWidget.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };
        //console.log('getData params', params);

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
        };

        //console.log(urls);
        Promise.all([
                fetch(urls.booking),
                fetch(urls.eventsCurrent),
                fetch(urls.eventsRepeat),
            ])
            .then(function(allResponses) {
                const bookingResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];
                return Promise.all([
                    bookingResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]) {
                // console.log('bookings', bookings);
                // console.log('eventsCurrent', eventsCurrent);
                // console.log('eventsCurrent', eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            });
    }
}

export default Booking;