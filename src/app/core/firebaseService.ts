import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import {Subject, merge} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})

export class FireBaseService {
  volunteerRef: AngularFireList<any>;
  volunteers: Observable<any[]>;
  count: any;
  eventRef: AngularFireList<any>;
  events: Observable<any[]>;
  pastEventRef: AngularFireList<any>;
  pastEvents: Observable<any[]>;
  eventDates = {};
  volunteerSampleRef: AngularFireList<any>;
  volunteerSamples: Observable<any[]>;
  eventChanges: Observable<any[]>;

  constructor(private db: AngularFireDatabase) {}

  getUserSamples(): Observable<any[]> {
    this.volunteerSampleRef = this.db.list('userSample');
    this.volunteerSamples = this.volunteerSampleRef.snapshotChanges().pipe(
      map(changes =>
        changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))
      )
    );
    return this.volunteerSamples;
  }

  getUsers(): Observable<any[]> {
    this.volunteerRef = this.db.list('user');
    this.volunteers = this.volunteerRef.snapshotChanges().pipe(
      map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))));
    return this.volunteers;
  }

  getEvents(): Observable<any[]> {
    this.eventRef = this.db.list('event');
    this.events = this.eventRef.snapshotChanges().pipe(
      map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val()}))));
    return this.events;
  }

  getEventsJson(): {} {
    this.events = this.getEvents();
    this.events.subscribe(snapshots => {
        snapshots.forEach(snapshot => {
          let event_date = snapshot.event_date.toString();
          const event_type = snapshot.event_type.toString();
          event_date = this.formatDate(event_date);
          if (!(event_date in this.eventDates)) {
            this.eventDates[event_date] = {};
            this.eventDates[event_date][event_type] = [snapshot.id];
          } else {
            if (!(event_type in this.eventDates[event_date])) {
              this.eventDates[event_date][event_type] = [snapshot.id];
            } else {
              this.eventDates[event_date][event_type].push(snapshot.id);
            }
          }
        });
    });
    return this.eventDates;
  }

  formatDate(date: string) {
    const year = '20' + date.substring(0, 2);
    const month = date.substring(2, 4);
    const day = date.substring(4, 6);
    date = month + '/' + day + '/' + year;
    return date;
  }

  changeEventImportance(event_id: string, is_important_event: boolean) {
    this.db.object('/event/' + event_id).update(
      {
        is_important_event: is_important_event
      }
    );
  }

  removeUserFromEvent(event_id: string): void {
    this.db.object('/event/' + event_id).update({
        first_name:  '',
        last_name:  '',
        uid: 'nan'
     });
   }


   addUserToEvent(event_id: string, first_name: string, last_name: string, uid: string): void {
     this.db.object('/event/' + event_id).update({
         first_name: first_name,
         last_name: last_name,
         uid: uid
      });
    }

    addNewBug(description): void {let count = this.getBugCount();
        count = count + 1;
        this.db.object('/bug/' + count).update({
            description: description
           });
        this.db.object('/bug/').update({
            count: count
        });
      }

      getBugCount() {
        this.db.object('bug').snapshotChanges().subscribe(action => this.count = action.payload.val().count);
        return this.count;
      }


  addPermanentVolunteer(event_type: string, user_id: string, weekday: string, start_date: Date, end_date: Date, frequency: string, event_id: string) {
    const permanent_event_id = event_type + "_" + weekday + "_" +  user_id + "_" + frequency;
    this.db.object('/permanent_events/' + permanent_event_id).update({
        event_type: event_type,
        user_id: user_id,
        start_date: start_date,
        end_date: end_date,
        frequency: frequency
     });
   }

    addPermanentVolunteerEvents(associatedPermanentEvents: [], user_id: string, first_name: string, last_name: string, permanent_event_id: string) {
        for( let i = 0; i < associatedPermanentEvents.length; i++ ) {
           this.db.object('/event/' + associatedPermanentEvents[i]).update({
             first_name: first_name,
             last_name: last_name,
             uid: user_id,
             permanent_event_id: permanent_event_id
        });
      }
    }


    removePermanentVolunteer(permanent_event_id) {
      this.db.object('/permanent_events/' + permanent_event_id).remove();
    }

    removePermanentVolunteerEvents(event_id) {
      console.log(event_id);

      console.log(this.db.object('/event/'+event_id+'/permanent_event_id').remove());
    }

    addStaffNoteToEvent(event_id: string, staff_note: string): void {
    this.db.object('/event/' + event_id).update({
        staff_note: staff_note
     });
    }



  }
