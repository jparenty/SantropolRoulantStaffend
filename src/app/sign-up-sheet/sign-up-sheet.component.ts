import { Component, OnInit } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import 'bootstrap/dist/js/bootstrap.bundle';
import {FireBaseService} from '../core/firebaseService'
import {MAT_TOOLTIP_DEFAULT_OPTIONS, MatTooltipDefaultOptions} from '@angular/material/tooltip';

export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 500,
  touchendHideDelay: 1000,
};

@Component({
  selector: 'app-sign-up-sheet',
  templateUrl: './sign-up-sheet.component.html',
  styleUrls: ['./sign-up-sheet.component.scss'],
  providers: [
    {provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults}
  ],
})

export class SignUpSheetComponent implements OnInit {
  private events: Observable<any[]>;
  private volunteers: Observable<any[]>;
  private permanent_events: Observable<any[]>;
  volunteerRef: AngularFireList<any>;
  private volunteerList = [];
  private volunteerListInitialized = false;
  private week1;
  private week2;
  private week3;
  private weekRange1: string;
  private weekRange2: string;
  private weekRange3: string;
  currentWeek = 'first';
  eventTypes = {'Kitchen AM' : 'kitam',
                        'Kitchen PM': 'kitpm',
                        'Delivery Driver': 'deldr',
                        'Delivery' : 'deliv',
                        'Kitcham AM Sat' : 'kitas',
                        'Kitchem PM Sat' : 'kitps',
                        'Delivery Driver Sat' : 'delds',
                        'Delivery Sat' : 'delis'
                      };
  currentEvent = 'Kitchen AM';
  private pane = 'left';
  items: Observable<any[]>;


  constructor(private db: AngularFireDatabase, private fs: FireBaseService) {}

  ngOnInit() {
    this.events = this.fs.getEvents();
    this.formatEventDates();
    this.volunteers = this.fs.getUsers();
    this.setVolunteerList();
    // this.db.list('event').auditTrail().subscribe(changes => { console.log(changes);
    //   // changes.forEach(c => console.log({ id: c.payload.key, ...c.payload.val() }))
    //
    // });

  }

  setVolunteerList() {
    this.volunteers.subscribe(snapshots => {
        if (this.volunteerListInitialized === true) {
          this.volunteerList = [];
        }
        this.volunteerListInitialized = false;
        snapshots.forEach(snapshot => {
          this.volunteerList.push(snapshot);
        });
    });
  }

  formatEventDates() {
    const events_per_week = 134;
    this.events.subscribe(snapshots => {
        let i = 0;
        this.week1 = [];
        this.week2 = [];
        this.week3 = [];
        snapshots.forEach(snapshot => {
          snapshot.event_date = this.fs.formatDate(snapshot.event_date.toString());
          const event_type = snapshot.event_type.toString();
          const event_date = snapshot.event_date;
          if (i < events_per_week) {
            if (!(event_type in this.week1)) {
              this.week1[event_type] = {};
            }
            if (!(event_date in this.week1[event_type])) {
              this.week1[event_type][event_date] = {
                'slots' : [],
                'num_volunteers' : 0,
                'num_slots' : 0,
                'is_important_event' : snapshot.is_important_event,
                'display_date': this.getDisplayDate(event_date)
              };
            }
            if (snapshot.first_name) {
              this.week1[event_type][event_date]['num_volunteers'] = this.week1[event_type][event_date]['num_volunteers'] + 1;
            }
            this.week1[event_type][event_date]['num_slots'] = this.week1[event_type][event_date]['num_slots'] + 1;
            this.week1[event_type][event_date]['slots'].push(snapshot);
          } else if (i >= events_per_week && i < 2 * events_per_week) {
            if (!(event_type in this.week2)) {
              this.week2[event_type] = {};
            }
            if (!(event_date in this.week2[event_type])) {
              this.week2[event_type][event_date] = {
                'slots' : [],
                'num_volunteers' : 0,
                'num_slots' : 0,
                'is_important_event' : snapshot.is_important_event,
                'display_date': this.getDisplayDate(event_date)
              };
            }
            if (snapshot.first_name) {
              this.week2[event_type][event_date]['num_volunteers'] = this.week2[event_type][event_date]['num_volunteers'] + 1;
            }
            this.week2[event_type][event_date]['num_slots'] = this.week2[event_type][event_date]['num_slots'] + 1;
            this.week2[event_type][event_date]['slots'].push(snapshot);
          } else {
            if (!(event_type in this.week3)) {
              this.week3[event_type] = {};
            }
            if (!(event_date in this.week3[event_type])){
              this.week3[event_type][event_date] = {
                'slots' : [],
                'num_volunteers' : 0,
                'num_slots' : 0,
                'is_important_event' : snapshot.is_important_event,
                'display_date': this.getDisplayDate(event_date)
              };
            }
            if (snapshot.first_name) {
              this.week3[event_type][event_date]['num_volunteers'] = this.week3[event_type][event_date]['num_volunteers'] + 1;
            }
            this.week3[event_type][event_date]['num_slots'] = this.week3[event_type][event_date]['num_slots'] + 1;
            this.week3[event_type][event_date]['slots'].push(snapshot);
          }
          i = i + 1;
        });
        this.weekRange1 = this.setWeekRange(this.week1);
        this.weekRange2 = this.setWeekRange(this.week2);
        this.weekRange3 = this.setWeekRange(this.week3);
        console.log(this.week1);
    });
  }

  isPermanentEvent(slot) {
    return "permanent_event_id" in slot;
  }
  getDisplayDate(date: string)
  {
    return new Date(date);
  }

  nextWeek() {
    this.currentWeek = this.currentWeek === 'first' ? 'second' : 'third';
  }

  prevWeek() {
    this.currentWeek = this.currentWeek === 'third' ? 'second' : 'first';
  }

  getWeekTitle(){
    if (this.currentWeek == 'first'){
      return this.weekRange1;
    }
    else if (this.currentWeek == 'second'){
      return this.weekRange2;
    }
    else {
      return this.weekRange3;
    }
  }

  setWeekRange(week){
    var week_title = '';
    const event = Object.keys(week)[0];
    const monday = new Date(Object.keys(week[event])[0]);
    const monday_month = monday.toLocaleString('default', { month: 'long' });
    const monday_date = monday.getDate();
    const monday_year = monday.getFullYear();
    var saturday = new Date(monday.getTime() + 5 * 86400000);
    const saturday_month = saturday.toLocaleString('default', { month: 'long' });
    const saturday_date = saturday.getDate();
    const saturday_year = saturday.getFullYear();
    if (monday_month != saturday_month){
      if (monday_year != saturday_year){
        week_title = monday_month + ' ' + monday_date + ', ' + monday_year + ' - ' + saturday_month + ' ' + saturday_date + ', ' + saturday_year;
      }
      else {
        week_title = monday_month + ' '+ monday_date + ' - ' + saturday_month + ' ' + saturday_date + ', ' + monday_year;
      }
    }
    else {
      week_title = monday_month + ' '+ monday_date + ' - ' + saturday_date + ', ' + monday_year;
    }
    return week_title;
  }

  getLastDate(week) {
    const event = Object.keys(week)[0];
    const monday = new Date(Object.keys(week[event])[0]);
    const monday_month = monday.toLocaleString('default', { month: 'long' });
    const monday_date = monday.getDate();
    const monday_year = monday.getFullYear();
    var saturday = new Date(monday.getTime() + 5 * 86400000);
    return saturday;
  }

  getEventList(){
    var currentEventValue = this.eventTypes[this.currentEvent];
    if (this.currentWeek == "first") {
      return this.week1[currentEventValue];
    }
    else if (this.currentWeek == "second"){
      return this.week2[currentEventValue];
    }
    else {
      return this.week3[currentEventValue];
    }
  }

  changeEventImportance(day: string){
    var slots;
    var is_important_event;
    var currentEventValue = this.eventTypes[this.currentEvent];
    if (this.currentWeek == "first") {
      is_important_event = !this.week1[currentEventValue][day]["is_important_event"];
      this.week1[currentEventValue][day]["is_important_event"] = is_important_event;
      slots =  this.week1[currentEventValue][day]["slots"];
    }
    else if (this.currentWeek == "second"){
      is_important_event = this.week2[currentEventValue][day]["is_important_event"];
      this.week2[currentEventValue][day]["is_important_event"] = !is_important_event;
      slots =  this.week2[currentEventValue][day]["slots"];
    }
    else {
      is_important_event = this.week3[currentEventValue][day]["is_important_event"];
      this.week3[currentEventValue][day]["is_important_event"] = !is_important_event;
      slots =  this.week3[currentEventValue][day]["slots"];
    }
    for (var slot of slots){
        this.fs.changeEventImportance(slot["id"], is_important_event);
    }
  }

  getVolunteerList() {
    return this.volunteerList;
  }

  getSignUpData() {
    return [{"slot": 0, "volunteer": "alexa"}, {"slot": 1, "volunteer": "alexa"}, {"slot": 2, "volunteer": "alexa"}]
  }

  removeUserFromEvent(event_id) {
    this.fs.removeUserFromEvent(event_id);
  }

  addUserToEvent(user, event_info) {
    var event_id = event_info.slots[event_info.num_volunteers].id;
    this.fs.addUserToEvent(event_id, user.first_name, user.last_name, user.key);
  }

  permanentVolunteerEvent(event, event_id, user_id, event_date, first_name, last_name, slot) {
    if ( event.event == "remove" ) {
      const data = event.removePermanentVolunteerData;
      const event_type =  this.eventTypes[data.eventType];
      const freq = slot.permanent_event_id.slice(-1);
      const associatedPermanentEvents = this.getAssociatedPermanentEvents(event_date, freq, this.eventTypes[data.eventType], true);
      this.fs.removePermanentVolunteer(
        slot.permanent_event_id
      )
      for(let i = 0; i < associatedPermanentEvents.length; i++) {
        this.fs.removePermanentVolunteerEvents(associatedPermanentEvents[i]);
      }
    }
    if ( event.event == "add" ) {
      const data = event.addPermanentVolunteerData;
      const event_type =  this.eventTypes[data.eventType];
      const associatedPermanentEvents = this.getAssociatedPermanentEvents(event_date, data.frequency, event_type, false);
      this.fs.addPermanentVolunteer(
        event_type,
        user_id,
        data.weekday,
        event_date,
        data.endDate,
        data.frequency,
        event_id
      );
      this.fs.addPermanentVolunteerEvents(
        associatedPermanentEvents,
        user_id,
        first_name,
        last_name,
        this.eventTypes[data.eventType] + '_' + data.weekday + '_' + user_id + '_' + data.frequency
      )
    }
  }

  getAssociatedPermanentEvents(startDate, frequency, event_type, remove): any {
    const associatedPermanentEvents = [];
    const lastDate = this.getLastDate(this.week3);
    let currentDate = startDate;
    while ( currentDate.getTime() <= lastDate.getTime() ) {
      const year = currentDate.getFullYear().toString();
      let month = currentDate.getMonth() + 1;
      month = month < 9 ? '0' + month.toString() : month.toString();
      let day = currentDate.getDate();
      day = day < 9 ? '0' + day.toString() : day.toString();
      const event_date = month + '/' + day + '/' + year;
      let slot_num;
      if ( event_date in this.week1[event_type] ) {
        slot_num = this.week1[event_type][event_date].num_volunteers;
      } else if ( event_date in this.week2[event_type] ) {
        slot_num = this.week2[event_type][event_date].num_volunteers;
      } else {
        slot_num = this.week3[event_type][event_date].num_volunteers;
      }
      slot_num = currentDate.getTime() === startDate.getTime() || remove ? slot_num : slot_num + 1;
      slot_num = slot_num < 9 ? '0' + slot_num.toString() : slot_num.toString();
      const event_id = year.slice(-2) + month + day + event_type + slot_num;
      associatedPermanentEvents.push(event_id);
      currentDate = new Date(currentDate.getTime() + (1000 * 604800 * frequency));
    }
    console.log("associatedper");
    console.log(associatedPermanentEvents);
    return associatedPermanentEvents;
  }

  insertStaffNote(event) {
    this.fs.addStaffNoteToEvent(event.event_id, event.staff_note);
  }
}
