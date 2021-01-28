import { templates, select, settings, classNames } from '../settings.js';
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
        thisBooking.pickTable();
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
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(select.booking.floor);
        thisBooking.dom.formSubmit = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
        thisBooking.dom.startes = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);

        //console.log(thisBooking.dom.phone);
        //console.log(thisBooking.dom.address);

    }

    initWidgets() {
        const thisBooking = this;
        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dateWidget = new DatePicker(thisBooking.dom.date);
        thisBooking.hourWidget = new HourPicker(thisBooking.dom.hour);

        thisBooking.dom.wrapper.addEventListener('updated', function(event) {
            thisBooking.updateDOM();
            //check if clicked widget is not peopleAmount or hoursAmount by event details
            if (event.detail.classes[1] != select.booking.peopleAmount.replace('.', '') &&
                event.detail.classes[1] != select.booking.hoursAmount.replace('.', '')
            ) {
                thisBooking.unpickTables();
            }
        });

        thisBooking.dom.formSubmit.addEventListener('submit', function(event) {
            event.preventDefault();
            thisBooking.sendBooking();
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

    getStarters() {
        const thisBooking = this;

        let starters = [];
        for (let checkbox of thisBooking.dom.startes) {
            starters.push(checkbox.value);
        }
        return starters;
    }

    unpickTables() {
        const thisBooking = this;

        for (let table of thisBooking.dom.tables) {
            //update DOM, remove class picked
            table.classList.remove(classNames.booking.tablePicked);
        }
        //clear picked table prop
        thisBooking.pickedTableId = null;
    }

    pickTable() {
        const thisBooking = this;

        thisBooking.pickedTableId = null;

        //nadać event listner 'click' na wraper stolików
        thisBooking.dom.floor.addEventListener('click', function(event) {
            event.preventDefault();

            //check if clicked element is table by atribute data-table
            if (event.target.getAttribute(settings.booking.tableIdAttribute)) {
                //set prop pickedTableId to data-table value
                const pickedTableId = parseInt(event.target.getAttribute(settings.booking.tableIdAttribute));
                //check if clicked table is booked
                if (thisBooking.nowBookedTablesId.includes(pickedTableId)) {
                    alert('Sorry Cannot book table nr ' + pickedTableId);
                } else {
                    //clear selection
                    thisBooking.unpickTables();
                    //add class picked 
                    event.target.classList.add(classNames.booking.tablePicked);
                    console.log('Picked ' + pickedTableId);
                    thisBooking.pickedTableId = pickedTableId;
                }
            }
        });

    }

    updateDOM() {
        const thisBooking = this;
        //check date
        thisBooking.date = thisBooking.dateWidget.value;
        //check hour
        thisBooking.hour = utils.hourToNumber(thisBooking.hourWidget.value);
        //set list of now booked tables to empty
        thisBooking.nowBookedTablesId = [];

        let allAvailable = false;

        if (
            //check if no reservation picked day
            typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
            //check if no reservation picked day and hour
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ) {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }
            //in case reservations now
            if (!allAvailable &&
                //check if this table is booked now
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                //add class booked
                table.classList.add(classNames.booking.tableBooked);
                //add table to booked now
                thisBooking.nowBookedTablesId.push(tableId);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
        //console.log('now booked: ', thisBooking.nowBookedTablesId);
    }

    sendBooking() {
        const thisBooking = this;
        thisBooking.getStarters();

        const url = settings.db.url + '/' + settings.db.booking;
        const payload = {
            'date': thisBooking.date,
            'hour': utils.numberToHour(thisBooking.hour),
            'table': thisBooking.pickedTableId,
            'duration': thisBooking.hoursAmountWidget.value,
            'ppl': thisBooking.peopleAmountWidget.value,
            'starters': thisBooking.getStarters(),
            'phone': thisBooking.dom.phone.value,
            'address': thisBooking.dom.address.value,
        };

        //preparing options data for request
        const options = {
            //indicate request method
            method: 'POST',
            //indicate headers
            headers: {
                'Content-Type': 'application/json',
            },
            //convert payload obj to JSON
            body: JSON.stringify(payload),
        };
        //making request  
        fetch(url, options)
            .then(function(response) {
                return response.json();
            })
            .then(function(parsedResponse) {
                console.log('bookingParsedResponse: ', parsedResponse);
                thisBooking.makeBooked(payload['date'], payload['hour'], payload['duration'], payload['table']);
                thisBooking.updateDOM();
            });

        //console.log(url);
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

        thisBooking.updateDOM();
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
        Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat), ])
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