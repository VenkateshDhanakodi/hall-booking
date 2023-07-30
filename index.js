const express = require('express');
const app = express();
app.use(express.json());
const port = normalizePort(process.env.PORT || '3000');
let rooms = [];
let bookings = [];

// Creating a Room
app.post('/createRoom', (req, res) => {
  try {
    const newRoom = req.body;
    //Checking all the informations are filled duering creation of room
    if (newRoom.roomName && newRoom.seatsAvailable && newRoom.amenities && newRoom.price) {
      //setting room Id
      newRoom.room_id = rooms.length + 1;
      //setting booked status of room
      newRoom.booked_status = false;
      rooms.push(newRoom);
      return res.status(201).send({
        message: "Room Created Successfully",
        rooms: rooms
      });
    } else {
      return res.status(400).send({
        error: 'Incomplete room information. Please provide roomNumber, seatsAvailable, amenities, and price.'
      });
    }
  } catch (error) {
    return res.status(500).send({
      error: 'Internal server error. Please try again later.'
    });
  }
});

// Booking a Room
let bookingIdCounter = 0; // Counter to keep track of booking IDs
app.post('/bookingRoom', (req, res) => {
  const newBooking = req.body;
  const roomId = newBooking.roomId;
  try {
    // Before booking the requested room, checking the room availability
    const roomIndex = rooms.findIndex((room) => room.room_id === roomId);
    if (roomIndex === -1) {
      return res.status(400).send({
        error: "Room not found"
      });
    }
    if (!newBooking.roomId || !newBooking.customerName || !newBooking.date || !newBooking.startTime || !newBooking.endTime) {
      return res.status(400).send({
        error: "Incomplete booking information. Please provide roomId, customerName, date, startTime, endTime"
      });
    }

    // Checking conflicts in booking
    const conflictBooking = bookings.find(booking =>
      booking.roomId === roomId &&
      booking.date === newBooking.date &&
      booking.startTime === newBooking.startTime &&
      booking.endTime === newBooking.endTime
    );

    if (conflictBooking) {
      return res.status(400).send({
        error: "Room is already booked"
      });
    }

    rooms[roomIndex].booked_status = true; // Update booked_status to true for the booked room

    // Set the roomId, bookingId, and bookingDate for the new booking
    newBooking.roomId = roomId;
    newBooking.bookingId = `BID${++bookingIdCounter}`; // Generating a unique booking ID
    newBooking.bookingDate = new Date().toISOString(); // Adding the booking date here
    bookings.push(newBooking);

    return res.status(201).send({
      message: "Room Booked Successfully"
    });

  } catch (error) {
    return res.status(500).send({
      error: "Internal server error. Please try again later"
    });
  }
});

//Listing all rooms with booked data
app.get('/roomBookingDetails', (req, res) => {
  try{
    const roomWithBookingDetails = rooms.map((room) => {
      const booking_details = bookings.find(
        (booking) => booking.roomId === room.room_id
      );
      return {
        //Returning the required booked data info
        roomName: room.roomName,
        booked: room.booked_status,
        customerName: booking_details ? booking_details.customerName : '',
        date: booking_details ? booking_details.date : '',
        startTime: booking_details ? booking_details.startTime : '',
        endTime: booking_details ? booking_details.endTime : ''
      };
    });
    res.status(200).send(roomWithBookingDetails);
  }catch{
    res.status(500).send("Internal server error. Please try again later")
  }
});

//Listing all customers with booked data

app.get('/customersBookingData', (req, res)=>{
  try{
    const booking_details = bookings.map((booking)=>{
      const getRoomName = rooms.find( room => booking.roomId === room.room_id);
      return{
        customerName: booking.customerName,
        roomName: getRoomName.roomName,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    });
    res.status(200).send(booking_details)
  }catch{
    res.status(500).send("Internal server error. Please try again later")
  }
});

// Listing how many times a customer has booked the room with additional details
app.get('/customerBookingCount', (req, res) => {
  const customerBookingCount = {};
  //Getting the required details to send response
  try{
    bookings.forEach((booking) => {
      const { customerName, roomId, date, startTime, endTime, bookingId, bookingDate, bookingStatus } = booking;
      //Checking customer exist or not if customer not existing, creating one array of object for one customer. If customer already exists ncreasing the count and adding the additional required informations to show
      if (!customerBookingCount[customerName]) {
        customerBookingCount[customerName] = {
          count: 1,
          bookings: [{
            roomNumber: roomId,
            date: date,
            startTime: startTime,
            endTime: endTime,
            bookingId: bookingId,
            bookingDate: bookingDate,
            bookingStatus: bookingStatus
          }]
        };
      } else {
        customerBookingCount[customerName].count++;
        customerBookingCount[customerName].bookings.push({
          roomNumber: roomId,
          date: date,
          startTime: startTime,
          endTime: endTime,
          bookingId: bookingId,
          bookingDate: bookingDate,
          bookingStatus: bookingStatus
        });
      }
    });
    res.status(200).send(customerBookingCount);
  }catch{
    res.status(500).send("Internal server error. Please try again later");
  }
});

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});