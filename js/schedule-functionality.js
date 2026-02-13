// Schedule functionality including Google Calendar integration and massage booking
import { doc, setDoc, getDoc, collection, getDocs, query, where, serverTimestamp, addDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Schedule functionality loaded');
    
    // Initialize all expandable sections
    initializeExpandableSections();
    
    // Initialize Google Calendar integration
    initializeCalendarIntegration();
    
    // Initialize massage booking
    initializeMassageBooking();
    
    // Initialize schedule tracking
    initializeScheduleTracking();
    
    // Initialize lunch navigation
    initializeLunchNavigation();
    
    // Removed presentation upload functionality
    
    // Add tab switching handler to auto-scroll to current event
    const scheduleTab = document.getElementById('schedule-tab');
    if (scheduleTab) {
        scheduleTab.addEventListener('click', function() {
            // Small delay to ensure tab content is visible
            setTimeout(() => {
                const currentEvent = document.querySelector('.schedule-current-time');
                if (currentEvent) {
                    currentEvent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
    }
});

// Initialize expandable sections
function initializeExpandableSections() {
    console.log('Initializing expandable sections...');
    
    // Coffee breaks
    const coffeeExpandables = document.querySelectorAll('.coffee-expandable');
    console.log('Found coffee expandables:', coffeeExpandables.length);
    
    coffeeExpandables.forEach(coffeeSection => {
        const title = coffeeSection.querySelector('.coffee-title');
        const details = coffeeSection.querySelector('.coffee-details');
        const icon = title ? title.querySelector('i') : null;
        
        if (title && details && icon) {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                console.log('Coffee expandable clicked');
                if (details.style.display === 'none' || details.style.display === '') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            console.log('Coffee expandable initialized');
        } else {
            console.log('Coffee expandable elements not found:', { title, details, icon });
        }
    });
    
    // Massage service
    const massageExpandables = document.querySelectorAll('.massage-expandable');
    console.log('Found massage expandables:', massageExpandables.length);
    
    massageExpandables.forEach(massageSection => {
        const title = massageSection.querySelector('.massage-title');
        const details = massageSection.querySelector('.massage-details');
        const icon = title ? title.querySelector('i') : null;
        
        if (title && details && icon) {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                console.log('Massage expandable clicked');
                if (details.style.display === 'none' || details.style.display === '') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            console.log('Massage expandable initialized');
        } else {
            console.log('Massage expandable elements not found:', { title, details, icon });
        }
    });
    
    // Round table discussion
    const roundtableExpandables = document.querySelectorAll('.roundtable-expandable');
    console.log('Found roundtable expandables:', roundtableExpandables.length);
    
    roundtableExpandables.forEach(roundtableSection => {
        const title = roundtableSection.querySelector('.roundtable-title');
        const details = roundtableSection.querySelector('.roundtable-details');
        const icon = title ? title.querySelector('i') : null;
        
        if (title && details && icon) {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                console.log('Roundtable expandable clicked');
                if (details.style.display === 'none' || details.style.display === '') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            console.log('Roundtable expandable initialized');
        } else {
            console.log('Roundtable expandable elements not found:', { title, details, icon });
        }
    });
    
    // Lecture sections
    const lectureExpandables = document.querySelectorAll('.lecture-expandable');
    console.log('Found lecture expandables:', lectureExpandables.length);
    
    lectureExpandables.forEach(lectureSection => {
        const title = lectureSection.querySelector('.lecture-title');
        const details = lectureSection.querySelector('.lecture-details');
        const icon = title ? title.querySelector('i') : null;
        
        if (title && details && icon) {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                console.log('Lecture expandable clicked');
                if (details.style.display === 'none' || details.style.display === '') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            console.log('Lecture expandable initialized');
        } else {
            console.log('Lecture expandable elements not found:', { title, details, icon });
        }
    });
    
    // Online presentations expandable sections
    const onlineExpandables = document.querySelectorAll('.online-expandable');
    console.log('Found online expandables:', onlineExpandables.length);
    
    onlineExpandables.forEach(onlineSection => {
        const title = onlineSection.querySelector('.online-title');
        const details = onlineSection.querySelector('.online-details');
        const icon = title ? title.querySelector('i') : null;
        
        if (title && details && icon) {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                console.log('Online expandable clicked');
                if (details.style.display === 'none' || details.style.display === '') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            console.log('Online expandable initialized');
        } else {
            console.log('Online expandable elements not found:', { title, details, icon });
        }
    });
    
    console.log('All expandable sections initialization completed');
}

// Google Calendar integration
function initializeCalendarIntegration() {
    const addToCalendarBtn = document.getElementById('addToCalendarBtn');
    if (addToCalendarBtn) {
        addToCalendarBtn.addEventListener('click', addAllEventsToCalendar);
    }
    
    // Add event listeners to existing calendar buttons
    attachCalendarButtonListeners();
    
    // Add individual calendar buttons to items that don't have them
    addIndividualCalendarButtons();
}

// Function to attach event listeners to existing calendar buttons
function attachCalendarButtonListeners() {
    const calendarButtons = document.querySelectorAll('.add-to-calendar-btn');
    
    calendarButtons.forEach(button => {
        // Remove existing listeners to avoid duplicates
        button.removeEventListener('click', handleCalendarButtonClick);
        button.addEventListener('click', handleCalendarButtonClick);
    });
}

// Handle calendar button clicks
function handleCalendarButtonClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const button = e.currentTarget;
    
    // Get event data from data attributes
    const title = button.getAttribute('data-event-title');
    const start = button.getAttribute('data-event-start');
    const end = button.getAttribute('data-event-end');
    const location = button.getAttribute('data-event-location');
    const description = button.getAttribute('data-event-description');
    
    if (title && start && end && location) {
        const event = {
            title: title,
            start: start,
            end: end,
            location: location,
            description: description || title
        };
        
        const googleCalendarUrl = createGoogleCalendarUrl(event);
        window.open(googleCalendarUrl, '_blank');
    } else {
        console.error('Missing event data on calendar button:', button);
    }
}

function addAllEventsToCalendar() {
    const events = [
        {
            title: 'TFPU 2025 - Registration & Welcome',
            start: '2025-07-16T19:00:00',
            end: '2025-07-16T19:30:00',
            location: 'Campus Restaurant, Petra Preradovića 9a, Pula',
            description: 'Registration and Welcome desk'
        },
        {
            title: 'TFPU 2025 - Cocktail & Ice-breaking Event',
            start: '2025-07-16T20:00:00',
            end: '2025-07-16T21:30:00',
            location: 'Campus Restaurant, Petra Preradovića 9a, Pula',
            description: 'Refreshments and networking'
        },
        {
            title: 'TFPU 2025 - Opening Ceremony',
            start: '2025-07-17T10:00:00',
            end: '2025-07-17T10:35:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Official welcome'
        },
        {
            title: 'TFPU 2025 - Invited Lecture 1',
            start: '2025-07-17T10:35:00',
            end: '2025-07-17T10:55:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'First invited lecture'
        },
        {
            title: 'TFPU 2025 - Coffee Break',
            start: '2025-07-17T11:00:00',
            end: '2025-07-17T11:10:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Refreshments'
        },
        {
            title: 'TFPU 2025 - Invited Lecture 2',
            start: '2025-07-17T11:10:00',
            end: '2025-07-17T11:35:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Second invited lecture'
        },
        {
            title: 'TFPU 2025 - Invited Lecture 3',
            start: '2025-07-17T11:35:00',
            end: '2025-07-17T12:00:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Third invited lecture'
        },
        {
            title: 'TFPU 2025 - Round Table Discussion',
            start: '2025-07-17T12:00:00',
            end: '2025-07-17T12:40:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Education and Opportunities in Dual Studies'
        },
        {
            title: 'TFPU 2025 - Lunch Break',
            start: '2025-07-17T12:40:00',
            end: '2025-07-17T13:30:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Pizza lunch - remember to make your selection!'
        },
        {
            title: 'TFPU 2025 - Upping Zone Lecture',
            start: '2025-07-17T13:30:00',
            end: '2025-07-17T14:20:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'From Failure to Success'
        },
        {
            title: 'TFPU 2025 - Coffee Break',
            start: '2025-07-17T14:20:00',
            end: '2025-07-17T14:30:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Refreshments'
        },
        {
            title: 'TFPU 2025 - Presentations',
            start: '2025-07-17T14:30:00',
            end: '2025-07-17T15:50:00',
            location: 'Coworking Pula, Marka Marulića 5, Pula',
            description: 'Engineering, Innovations, Industry & Technology / Medicine, Society & Innovations'
        },
        {
            title: 'TFPU 2025 - City Tour & Networking',
            start: '2025-07-17T18:00:00',
            end: '2025-07-17T20:00:00',
            location: 'Pula City Center',
            description: 'Self-organized city tour and networking'
        },
        {
            title: 'TFPU 2025 - Breakfast & Exhibition',
            start: '2025-07-18T10:00:00',
            end: '2025-07-18T12:00:00',
            location: 'Campus Restaurant, Petra Preradovića 9a, Pula',
            description: 'Breakfast with Participants + Opening of the Exhibition: Science, Technology and Art'
        },
        {
            title: 'TFPU 2025 - Transfer to Fratarski Island',
            start: '2025-07-18T13:30:00',
            end: '2025-07-18T14:30:00',
            location: 'Fratarski Island Student Camp',
            description: 'Transfer to island activities'
        },
        {
            title: 'TFPU 2025 - Island Lectures & Workshops',
            start: '2025-07-18T17:00:00',
            end: '2025-07-18T20:00:00',
            location: 'Fratarski Island Student Camp',
            description: 'Lectures and Workshops on the island'
        }
    ];
    
    // Create Google Calendar links for all events
    const calendarLinks = events.map(event => {
        return createGoogleCalendarUrl(event);
    });
    
    // Open multiple calendar windows (browsers might block this)
    if (confirm('This will open multiple tabs to add all conference events to your Google Calendar. Continue?')) {
        calendarLinks.forEach((link, index) => {
            setTimeout(() => {
                window.open(link, '_blank');
            }, index * 500); // Stagger the opening to avoid popup blockers
        });
    }
}

// Helper function to create Google Calendar URL
function createGoogleCalendarUrl(event) {
    const startTime = event.start.replace(/[-:]/g, '').replace('T', 'T');
    const endTime = event.end.replace(/[-:]/g, '').replace('T', 'T');
    
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${startTime}/${endTime}`,
        location: event.location,
        details: event.description
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Massage booking functionality
function initializeMassageBooking() {
    populateMassageTimeSlots();
    updateAvailableTimeSlots(); // Check slot availability
    
    const timeSlotSelect = document.getElementById('massageTimeSlot');
    const bookBtn = document.getElementById('bookMassageBtn');
    
    if (timeSlotSelect) {
        timeSlotSelect.addEventListener('change', function() {
            bookBtn.disabled = !this.value;
        });
    }
    
    if (bookBtn) {
        bookBtn.addEventListener('click', bookMassageAppointment);
    }
    
    // Load existing booking
    loadExistingMassageBooking();
}

function populateMassageTimeSlots() {
    const timeSlotSelect = document.getElementById('massageTimeSlot');
    if (!timeSlotSelect) return;

    // Define time slots with 10-minute sessions and 5-minute breaks
    const timeSlots = [
        { start: '10:00', end: '10:10' },
        { start: '10:15', end: '10:25' },
        { start: '10:30', end: '10:40' },
        { start: '10:45', end: '10:55' },
        { start: '11:00', end: '11:10' },
        { start: '11:15', end: '11:25' },
        { start: '11:30', end: '11:40' },
        { start: '11:45', end: '11:55' },
        { start: '12:00', end: '12:10' },
        { start: '12:15', end: '12:25' },
        // Lunch break from 12:30 to 13:30
        { start: '13:30', end: '13:40' },
        { start: '13:45', end: '13:55' },
        { start: '14:00', end: '14:10' },
        { start: '14:15', end: '14:25' }
    ];

    timeSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.start;
        option.textContent = `${slot.start} - ${slot.end}`;
        timeSlotSelect.appendChild(option);
    });
}

async function bookMassageAppointment() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    const timeSlot = document.getElementById('massageTimeSlot').value;
    
    if (!userId || !timeSlot) {
        showMassageStatus('Please select a time slot', 'danger');
        return;
    }

    try {
        // Check if user already has a booking
        const userBookingsQuery = query(
            collection(db, "massageBookings"), 
            where("userId", "==", userId)
        );
        const userBookings = await getDocs(userBookingsQuery);
        
        if (!userBookings.empty) {
            showMassageStatus('You already have a massage appointment booked', 'warning');
            return;
        }

        // Check how many bookings exist for this time slot
        const slotQuery = query(collection(db, "massageBookings"), where("timeSlot", "==", timeSlot));
        const slotBookings = await getDocs(slotQuery);
        
        if (slotBookings.size >= 2) {
            showMassageStatus('This time slot is fully booked (2 chairs occupied)', 'warning');
            return;
        }

        // Create unique booking ID with chair number
        const chairNumber = slotBookings.size + 1;
        const bookingRef = doc(db, "massageBookings", `${timeSlot}-chair${chairNumber}-${userId}`);
        
        // Create booking
        await setDoc(bookingRef, {
            userId: userId,
            userName: userName,
            timeSlot: timeSlot,
            chairNumber: chairNumber,
            date: '2025-07-17',
            service: 'physio_massage',
            bookedAt: serverTimestamp()
        });
        
        showMassageStatus(`Appointment booked for ${timeSlot} (Chair ${chairNumber})!`, 'success');
        document.getElementById('bookMassageBtn').disabled = true;
        document.getElementById('massageTimeSlot').disabled = true;
        
        // Massage reminder scheduling disabled
        console.log('Massage reminder scheduling is disabled');
        
        // Schedule reminder notification 10 minutes before - disabled
        // await scheduleMassageReminder(timeSlot, userId);
        
    } catch (error) {
        console.error('Error booking massage appointment:', error);
        showMassageStatus('Error booking appointment. Please try again.', 'danger');
    }
}

async function loadExistingMassageBooking() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    try {
        const userBookingsQuery = query(
            collection(db, "massageBookings"), 
            where("userId", "==", userId)
        );
        const userBookings = await getDocs(userBookingsQuery);
        
        if (!userBookings.empty) {
            const booking = userBookings.docs[0].data();
            document.getElementById('massageTimeSlot').value = booking.timeSlot;
            document.getElementById('massageTimeSlot').disabled = true;
            document.getElementById('bookMassageBtn').disabled = true;
            document.getElementById('bookMassageBtn').textContent = 'Booked';
            document.getElementById('bookMassageBtn').classList.remove('btn-success');
            document.getElementById('bookMassageBtn').classList.add('btn-secondary');
            
            showMassageStatus(`You have an appointment at ${booking.timeSlot}`, 'info');
        }
    } catch (error) {
        console.error('Error loading existing booking:', error);
    }
}

function showMassageStatus(message, type) {
    const statusDiv = document.getElementById('massageBookingStatus');
    if (statusDiv) {
        statusDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    }
}

// Function to schedule massage reminder notification - DISABLED
/*
async function scheduleMassageReminder(timeSlot, userId) {
    try {
        // Create reminder date for July 17, 2025
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const reminderDate = new Date('2025-07-17T' + timeSlot + ':00');
        reminderDate.setMinutes(reminderDate.getMinutes() - 10); // 10 minutes before
        
        const reminderData = {
            title: "Massage Appointment Reminder",
            message: `Your physio massage appointment is starting in 10 minutes at ${timeSlot}. Please head to the massage area at Coworking Pula.`,
            timestamp: Timestamp.fromDate(reminderDate),
            scheduledFor: Timestamp.fromDate(reminderDate),
            type: 'massage_reminder',
            userId: userId,
            timeSlot: timeSlot,
            createdBy: 'system',
            createdAt: serverTimestamp()
        };
        
        const { Timestamp } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
        const notificationsRef = collection(db, "massageReminders");
        const docRef = await addDoc(notificationsRef, reminderData);
        
        console.log("Massage reminder scheduled with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error scheduling massage reminder:", error);
        return { success: false, error: error.message };
    }
}
*/

// Real-time schedule tracking
function initializeScheduleTracking() {
    updateScheduleProgress();
    
    // Automatic schedule progress updates disabled
    console.log('Automatic schedule updates are disabled');
    
    // Update every minute - disabled
    // setInterval(updateScheduleProgress, 60000);
    
    // Scroll to current event on page load
    setTimeout(() => {
        const currentEvent = document.querySelector('.schedule-current-time');
        if (currentEvent) {
            currentEvent.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 1000);
}

function updateScheduleProgress() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes
    
    // Define conference events with their times
    const conferenceEvents = [
        // Day 1 - July 16, 2025
        { date: '2025-07-16', startTime: 19 * 60, endTime: 19 * 60 + 30, id: 'day1-registration' },
        { date: '2025-07-16', startTime: 20 * 60, endTime: 21 * 60 + 30, id: 'day1-cocktail' },
        
        // Day 2 - July 17, 2025
        { date: '2025-07-17', startTime: 10 * 60, endTime: 10 * 60 + 35, id: 'day2-opening' },
        { date: '2025-07-17', startTime: 10 * 60 + 35, endTime: 10 * 60 + 55, id: 'day2-lecture1' },
        { date: '2025-07-17', startTime: 11 * 60, endTime: 11 * 60 + 10, id: 'day2-coffee1' },
        { date: '2025-07-17', startTime: 11 * 60 + 10, endTime: 11 * 60 + 35, id: 'day2-lecture2' },
        { date: '2025-07-17', startTime: 11 * 60 + 35, endTime: 12 * 60, id: 'day2-lecture3' },
        { date: '2025-07-17', startTime: 12 * 60, endTime: 12 * 60 + 40, id: 'day2-roundtable' },
        { date: '2025-07-17', startTime: 12 * 60 + 40, endTime: 13 * 60 + 30, id: 'day2-lunch' },
        { date: '2025-07-17', startTime: 13 * 60 + 30, endTime: 14 * 60 + 20, id: 'day2-upping' },
        { date: '2025-07-17', startTime: 14 * 60 + 20, endTime: 14 * 60 + 30, id: 'day2-coffee2' },
        { date: '2025-07-17', startTime: 14 * 60 + 30, endTime: 15 * 60 + 50, id: 'day2-presentations' },
        { date: '2025-07-17', startTime: 18 * 60, endTime: 20 * 60, id: 'day2-citytour' },
        
        // Day 3 - July 18, 2025
        { date: '2025-07-18', startTime: 10 * 60, endTime: 12 * 60, id: 'day3-breakfast' },
        { date: '2025-07-18', startTime: 13 * 60 + 30, endTime: 14 * 60 + 30, id: 'day3-transfer' },
        { date: '2025-07-18', startTime: 17 * 60, endTime: 20 * 60, id: 'day3-lectures' }
    ];
    
    // Clear all existing classes
    document.querySelectorAll('.schedule-item').forEach(item => {
        item.classList.remove('schedule-current-time', 'schedule-past-event', 'schedule-next-event');
    });
    
    // Find events for current date
    const todayEvents = conferenceEvents.filter(event => event.date === currentDate);
    
    if (todayEvents.length === 0) {
        return; // No events today
    }
    
    let currentEventIndex = -1;
    let nextEventIndex = -1;
    
    // Find current and next events
    for (let i = 0; i < todayEvents.length; i++) {
        const event = todayEvents[i];
        
        if (currentTime >= event.startTime && currentTime < event.endTime) {
            currentEventIndex = i;
            break;
        } else if (currentTime < event.startTime) {
            nextEventIndex = i;
            break;
        }
    }
    
    // Mark past events
    for (let i = 0; i < currentEventIndex; i++) {
        const scheduleItem = getScheduleItemByTime(todayEvents[i]);
        if (scheduleItem) {
            scheduleItem.classList.add('schedule-past-event');
        }
    }
    
    // Mark current event
    if (currentEventIndex >= 0) {
        const currentScheduleItem = getScheduleItemByTime(todayEvents[currentEventIndex]);
        if (currentScheduleItem) {
            currentScheduleItem.classList.add('schedule-current-time');
        }
    }
    
    // Mark next event
    if (nextEventIndex >= 0) {
        const nextScheduleItem = getScheduleItemByTime(todayEvents[nextEventIndex]);
        if (nextScheduleItem) {
            nextScheduleItem.classList.add('schedule-next-event');
        }
    } else if (currentEventIndex < 0 && todayEvents.length > 0) {
        // If no current event but there are events today, mark the first one as next
        const firstScheduleItem = getScheduleItemByTime(todayEvents[0]);
        if (firstScheduleItem) {
            firstScheduleItem.classList.add('schedule-next-event');
        }
    }
}

function getScheduleItemByTime(event) {
    const startHour = Math.floor(event.startTime / 60);
    const startMinute = event.startTime % 60;
    const endHour = Math.floor(event.endTime / 60);
    const endMinute = event.endTime % 60;
    
    const timeString = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} – ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Find the schedule item with this time
    const scheduleItems = document.querySelectorAll('.schedule-item');
    for (const item of scheduleItems) {
        const timeElement = item.querySelector('.fw-bold');
        if (timeElement && timeElement.textContent.includes(timeString)) {
            return item;
        }
    }
    
    return null;
}

// Function to update available time slots based on bookings
async function updateAvailableTimeSlots() {
    const timeSlotSelect = document.getElementById('massageTimeSlot');
    if (!timeSlotSelect) return;

    try {
        // Get all current bookings
        const bookingsQuery = query(collection(db, "massageBookings"));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        // Count bookings per time slot
        const slotCounts = {};
        bookingsSnapshot.forEach(doc => {
            const data = doc.data();
            const timeSlot = data.timeSlot;
            slotCounts[timeSlot] = (slotCounts[timeSlot] || 0) + 1;
        });
        
        // Update select options
        Array.from(timeSlotSelect.options).forEach(option => {
            if (option.value && slotCounts[option.value] >= 2) {
                option.disabled = true;
                option.textContent = option.textContent.replace(' - FULL', '') + ' - FULL';
            }
        });
        
    } catch (error) {
        console.error('Error updating available time slots:', error);
    }
}

// Function to add individual calendar buttons to schedule items
function addIndividualCalendarButtons() {
    const scheduleItems = document.querySelectorAll('.schedule-item');
    
    scheduleItems.forEach((item, index) => {
        const timeElement = item.querySelector('.fw-bold');
        const titleElement = item.querySelector('p');
        
        if (timeElement && titleElement) {
            const timeText = timeElement.textContent.trim();
            const title = titleElement.textContent.trim();
            
            // Skip if already has a button
            if (item.querySelector('.add-to-calendar-btn')) return;
            
            // Create calendar button
            const calendarBtn = document.createElement('button');
            calendarBtn.className = 'btn btn-outline-primary btn-sm add-to-calendar-btn ms-2';
            calendarBtn.innerHTML = '<i class="bi bi-calendar-plus"></i>';
            calendarBtn.title = 'Add to Google Calendar';
            calendarBtn.style.float = 'right';
            
            // Determine the date based on the accordion section
            let eventDate = '2025-07-16'; // Default Day 1
            const accordionItem = item.closest('.accordion-item');
            if (accordionItem) {
                const dayTitle = accordionItem.querySelector('.accordion-button').textContent;
                if (dayTitle.includes('July 17')) {
                    eventDate = '2025-07-17';
                } else if (dayTitle.includes('July 18')) {
                    eventDate = '2025-07-18';
                }
            }
            
            // Get location based on day
            let location = 'Campus Restaurant, Petra Preradovića 9a, Pula';
            if (eventDate === '2025-07-17') {
                location = 'Coworking Pula, Marka Marulića 5, Pula';
            } else if (eventDate === '2025-07-18') {
                location = 'Campus Restaurant / Fratarski Island, Pula';
            }
            
            calendarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addSingleEventToCalendar(title, timeText, eventDate, location);
            });
            
            // Add button to the time element
            timeElement.style.position = 'relative';
            timeElement.appendChild(calendarBtn);
        }
    });
}

// Function to add a single event to Google Calendar
function addSingleEventToCalendar(title, timeText, date, location) {
    try {
        // Parse time range
        const timeRange = timeText.split('–');
        let startTime, endTime;
        
        if (timeRange.length === 2) {
            startTime = timeRange[0].trim();
            endTime = timeRange[1].trim();
        } else {
            // Single time or "From" time
            startTime = timeText.replace('From ', '').trim();
            endTime = startTime; // Default to same time if no end time
            
            // Add 1 hour for single times
            const [hours, minutes] = startTime.split(':');
            const endHour = (parseInt(hours) + 1).toString().padStart(2, '0');
            endTime = `${endHour}:${minutes}`;
        }
        
        const startDateTime = `${date}T${startTime}:00`;
        const endDateTime = `${date}T${endTime}:00`;
        
        const event = {
            title: `TFPU 2025 - ${title}`,
            start: startDateTime,
            end: endDateTime,
            location: location,
            description: `BioMedix TPM 2025 event. Location: ${location}`
        };
        
        const googleCalendarUrl = createGoogleCalendarUrl(event);
        window.open(googleCalendarUrl, '_blank');
        
    } catch (error) {
        console.error('Error creating calendar event:', error);
        alert('Error creating calendar event. Please try again.');
    }
}

// Initialize lunch navigation from Conference Info
function initializeLunchNavigation() {
    const lunchSelectionLink = document.getElementById('lunchSelectionLink');
    if (lunchSelectionLink) {
        lunchSelectionLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 1. Switch to Schedule tab if not already active
            const scheduleTab = document.getElementById('schedule-tab');
            const scheduleContent = document.getElementById('schedule');
            
            if (scheduleTab && scheduleContent) {
                // Activate the schedule tab
                if (!scheduleTab.classList.contains('active')) {
                    // Remove active from all tabs
                    document.querySelectorAll('.tabs-link').forEach(tab => {
                        tab.classList.remove('active');
                        tab.setAttribute('aria-selected', 'false');
                    });
                    document.querySelectorAll('.tab-pane').forEach(pane => {
                        pane.classList.remove('show', 'active');
                    });
                    
                    // Activate schedule tab
                    scheduleTab.classList.add('active');
                    scheduleTab.setAttribute('aria-selected', 'true');
                    scheduleContent.classList.add('show', 'active');
                }
                
                // Small delay to ensure tab content is visible
                setTimeout(() => {
                    // 2. Expand Day 2 if not already expanded
                    const day2Collapse = document.getElementById('collapseDay2');
                    const day2Button = document.querySelector('[data-bs-target="#collapseDay2"]');
                    
                    if (day2Collapse && day2Button) {
                        if (!day2Collapse.classList.contains('show')) {
                            // Expand Day 2
                            day2Button.classList.remove('collapsed');
                            day2Button.setAttribute('aria-expanded', 'true');
                            day2Collapse.classList.add('show');
                        }
                        
                        // Another small delay to ensure Day 2 content is visible
                        setTimeout(() => {
                            // 3. Find and expand the lunch section
                            const lunchExpandable = document.querySelector('.lunch-expandable');
                            const lunchTitle = document.getElementById('lunchTitle');
                            const lunchDetails = document.getElementById('lunchDetails');
                            const lunchIcon = document.getElementById('lunchIcon');
                            
                            if (lunchExpandable && lunchTitle && lunchDetails && lunchIcon) {
                                // Expand lunch section if not already expanded
                                if (lunchDetails.style.display === 'none') {
                                    lunchDetails.style.display = 'block';
                                    lunchIcon.classList.remove('bi-chevron-down');
                                    lunchIcon.classList.add('bi-chevron-up');
                                }
                                
                                // 4. Scroll to the lunch section
                                lunchExpandable.scrollIntoView({ 
                                    behavior: 'smooth', 
                                    block: 'center' 
                                });
                            }
                        }, 300);
                    }
                }, 100);
            }
        });
    }
}

// Presentation upload functionality removed



export { initializeExpandableSections, initializeCalendarIntegration, initializeMassageBooking, initializeScheduleTracking, initializeLunchNavigation };
