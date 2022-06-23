#include "SerialMP3Player.h"

#include <Wire.h> // Include the I2C library (required)
#include <SparkFunSX1509.h> // Include SX1509 library


#include <Adafruit_NeoPixel.h>
#define powercell_PIN 31
#define PIXELS  14

Adafruit_NeoPixel powercell = Adafruit_NeoPixel(PIXELS, powercell_PIN, NEO_GRB + NEO_KHZ800);

#define PM_TIME  800 // time to max power in milliseconds
#define MIN_DELAY   50  // minimum time between pixel updates in milliseconds


// Arduino pin where the buttons are connected to
#define BUTTON_ONE 2  //main power
#define BUTTON_TWO 3  // safety1
#define BUTTON_THREE 4 //safety2
#define BUTTON_FOUR 5  //wandon - activate
#define BUTTON_FIVE 6  // Which pin on the Arduino is connected to the "FIRE" signal for cyclotron
#define BUTTON_SIX 7   //barrelpush

#define PIN 30          // Which pin on the Arduino is connected to the NeoPixels?
#define NUM_LEDS 41    // How many NeoPixels are attached to the Arduino?

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, PIN, NEO_GRB + NEO_KHZ800);


int blast_speed = 8;
int blast_interval = 15000;
unsigned long
preBlastMillis = 0,
blastMillis = 0;
bool POWERON = true;
bool POWEROFF = true;


bool  sw10, sw11, sw20, sw21, sw30, sw31, sw40, sw41 = true;
int power_switch = (BUTTON_ONE);
int safety_switch1 = (BUTTON_TWO);
int safety_switch2 = (BUTTON_THREE);
int wandon_switch = (BUTTON_FOUR);
int blast =  (BUTTON_FIVE);
int barrelfire = (BUTTON_SIX);
class Flasher
{
    // Class Member Variables
    // These are initialized at startup
    int ledPin;      // the number of the LED pin
    long OnTime;     // milliseconds of on-time
    long OffTime;    // milliseconds of off-time

    // These maintain the current state
    int ledState;                 // ledState used to set the LED
    unsigned long previousMillis;   // will store last time LED was updated

    // Constructor - creates a Flasher
    // and initializes the member variables and state
  public:
    Flasher(int pin, long on, long off)
    {
      ledPin = pin;
      pinMode(ledPin, OUTPUT);

      OnTime = on;
      OffTime = off;

      ledState = LOW;
      previousMillis = 0;
    }

    void Update( int from, int ends) {
      // check to see if it's time to change the state of the LED
      unsigned long currentMillis = millis();

      if (from < ends) {
        if ((ledState == HIGH) && (currentMillis - previousMillis >= OnTime))
        { from++;
          ledState = LOW;  // Turn it off
          previousMillis = currentMillis;  // Remember the time
          digitalWrite(ledPin, ledState);  // Update the actual LED
        }
        else if ((ledState == LOW) && (currentMillis - previousMillis >= OffTime))
        { from++;
          ledState = HIGH;  // turn it on
          previousMillis = currentMillis;   // Remember the time
          digitalWrite(ledPin, ledState);   // Update the actual LED
        }
      }
      else if (from >= ends) {
        ends = from;
      }
    }
};



/***LED PINS***/

#define SLOBLO 22
#define ORANGEFLASH 23   //GREEBLELED
#define FRONTFLASH 24  // frontled
#define TOPFLASH 25    //topled
#define BOXLIGHT 26
#define BARRELFLASHER 27 //barrelled




#define TX 18
#define RX 19

SerialMP3Player mp3(RX, TX);
// SX1509 I2C address (set by ADDR1 and ADDR0 (00 by default):
const byte ADDRESS = 0x3E;  // SX1509 I2C address
SX1509 io; // Create an SX1509 object to be used throughout

int seq_1_current = 0;  // current led in sequence 1
const int num_led = 14; // total number of leds in bar

// SX1509 pin definitions for the leds on the graph:
const byte BAR_01 = 0;
const byte BAR_02 = 1;
const byte BAR_03 = 2;
const byte BAR_04 = 3;
const byte BAR_05 = 4;
const byte BAR_06 = 5;
const byte BAR_07 = 6;
const byte BAR_08 = 7;
const byte BAR_09 = 8;
const byte BAR_10 = 9;
const byte BAR_11 = 10;
const byte BAR_12 = 11;
const byte BAR_13 = 12;
const byte BAR_14 = 13;
const byte BAR_15 = 14;
const byte BAR_16 = 15;


/*************PACK STATES  ******************************/

boolean POWERBOOTED = false;
boolean ISFIRING = false;
boolean VENTING = false;
boolean BARREL_PUSHED = false;
boolean SONGPLAYING = false;
boolean idleing = true;


char cyclotron_start[]    =  "T00 mp3";
char powerdown[]   =  "T01 mp3";
char idle_track[]   =  "T02 mp3";
char safety1[]   =  "T03 mp3";
char safety2[]     =  "T04 mp3";
char error[]     =  "T05 mp3";
char endfirestart[]   =  "T06 mp3";
char endfire[]   =  "T07 mp3";
char click_track[]  =  "T08 mp3";
char blasts[]    =  "T09 mp3";
char warning[]    =  "T10 mp3";
char wand_on[]    =  "T11 mp3";
char vent[]    =  "T12 mp3";


int song = 0;
int ledState = LOW;

unsigned long previousmillis = 0;
int meterlevel = 0;

unsigned long lastMeterResetTime;


/************************* Shutdown and helper functions ****************************/





void bargraph_off() {

  //shut all led's off
  for (int i = 0; i <= 16; i++) {
    io.digitalWrite(i, LOW);
  }
}


void doCycle() {
  lastMeterResetTime = millis();
  meterlevel = 0;

}
void power_cell_start()
{
  for (int i = 0; i < PIXELS; i++)
  {
    powercell.setPixelColor(i,  powercell.Color(0, 0, 200));
    powercell.show();
    delay(700);
 }
}
void power_cell_idle()
{
  unsigned long currentMillis = millis();

  meterlevel = ((currentMillis - lastMeterResetTime) * PIXELS) / PM_TIME;

  if (meterlevel > PIXELS)
    doCycle();

  for (int i = 0; i < PIXELS; i++) {
    // pixels.Color takes RGB values, from 0,0,0 up to 255,255,255
    if (meterlevel >= i + 1)
      powercell.setPixelColor(i, powercell.Color(0, 0, 200));
    else
      powercell.setPixelColor(i, powercell.Color(0, 0, 0));
  }
  powercell.show();


  // Delay for a minmum period of time before next pixel update
  delay(MIN_DELAY);
}
void power_cell_off()
{
  for (int i = 14; i >= 0; i--)
  {
    powercell.setPixelColor(i,  powercell.Color(0, 0, 0));
    powercell.show();
    delay(1);
  }
}

// physical switch states
bool startup = false;
bool songs = false;
bool endFiring = false;



// Variables will change:

unsigned long previousMillis = 0;        // will store last time LED was updated
int playingNow = 0;
int firing = 0;


Flasher GREEBLELED(ORANGEFLASH, 100, 400);
Flasher frontled(FRONTFLASH, 300, 300);
Flasher topled(TOPFLASH, 100, 1200);
Flasher barrelled(BARRELFLASHER, 10, 20);


void setup()
{
  pinMode(BUTTON_ONE, INPUT_PULLUP); // button also connected to GN
  pinMode(BUTTON_TWO, INPUT_PULLUP);  //safety one
  pinMode(BUTTON_THREE, INPUT_PULLUP); // safety two
  pinMode(BUTTON_FOUR, INPUT_PULLUP); //activate wand
  pinMode(BUTTON_FIVE, INPUT_PULLUP); // blast
  pinMode(BUTTON_SIX, INPUT_PULLUP); // song selection
  pinMode (SLOBLO, OUTPUT);
  pinMode (ORANGEFLASH, OUTPUT);
  pinMode (FRONTFLASH , OUTPUT);
  pinMode  (TOPFLASH, OUTPUT);
  pinMode  (BOXLIGHT, OUTPUT);
  pinMode (BARRELFLASHER, OUTPUT);

  if (!io.begin(ADDRESS)) {
    while (1) ;
  }

  // configuration for the bargraph LED's
  io.pinMode(BAR_01, OUTPUT);
  io.pinMode(BAR_02, OUTPUT);
  io.pinMode(BAR_03, OUTPUT);
  io.pinMode(BAR_04, OUTPUT);
  io.pinMode(BAR_05, OUTPUT);
  io.pinMode(BAR_06, OUTPUT);
  io.pinMode(BAR_07, OUTPUT);
  io.pinMode(BAR_08, OUTPUT);
  io.pinMode(BAR_09, OUTPUT);
  io.pinMode(BAR_10, OUTPUT);
  io.pinMode(BAR_11, OUTPUT);
  io.pinMode(BAR_12, OUTPUT);
  io.pinMode(BAR_13, OUTPUT);
  io.pinMode(BAR_14, OUTPUT);
  io.pinMode(BAR_15, OUTPUT);
  io.pinMode(BAR_16, OUTPUT);

  bargraph_off();


  //Setup and start the cyclotron



  powercell.begin();
  powercell.clear();

  mp3.showDebug(1);       // print what we are sending to the mp3 board.

  Serial.begin(9600);     // start serial interface
  mp3.begin(9600);        // start mp3-communication
  delay(500);             // wait for init

  mp3.sendCommand(CMD_SEL_DEV, 0, 2);   //select sd-card
  delay(500);             // wait for init
  mp3.setVol(30);

}



/********SOUNDS WEIRDLY DONE********


  cyclotron_start    =  9
  powerdown    =  10
  idle_track   =  11
  safety1      =  2
  safety2      =  3
  error        =  1
  endfirestart =  12
  endfire      =  7
  click_track  =  13
  blast        =  6
  warning      =  5
  wand_on      =  8
  vent         =  4


************************************
  Play - mp3.play(nval);
  Play Folder - mp3.playF(nval);
  Play loop - mp3.playSL(nval);
  Play file at 30 volume - mp3.play(nval,30);
  Play if paused - mp3.play();
  Pause - mp3.pause();
  Stop -  mp3.stop();
  Next track - mp3.playNext();
  Previous track - mp3.playPrevious();
  Volume UP - mp3.volUp();
  Volume Down - mp3.volDown();
  set to Volume - mp3.setVol(nval);
              - mp3.qVol();
  Query current file -  mp3.qPlaying();
  Query status - mp3.qStatus();
  Query folder count - mp3.qTFolders();
  Query total file count - mp3.qTTracks();
     reset   - mp3.reset();
  sleep   -    mp3.sleep();
  wake up    -   mp3.wakeup();

 ****************/


long firing_interval = 40;    // interval at which to cycle firing lights on the bargraph. We update this in the loop to speed up the animation so must be declared here (milliseconds).


void loop() {


  unsigned long currentMillis = millis();


  // song selection
  int theme_switch = digitalRead(BUTTON_SIX);

  if (theme_switch == LOW  ) {
    if (SONGPLAYING == true)
      song ++;
    if (song > 5)song = 1;
    switch (song) {
      case 1:
        mp3.play(14);
        power_cell_idle();
        break;
      case 2 :
        mp3.play(15);
        power_cell_idle();

        break;
      case 3:
        mp3.play(16);
        power_cell_idle();

        break;
      case 4 :
        mp3.play(17);
        power_cell_idle();

        break;
      case 5 :
        mp3.play(18);
        power_cell_idle();

        break;
    }
    SONGPLAYING = false;
  } else SONGPLAYING = true;


  // CHECK POWER , THIS WILL ENABLE ALL SWITCHES TO WORK, WITHOUT THIS ON NOTHING WILL WORK
  if (!digitalRead(BUTTON_ONE) ) {
    POWEROFF = true;
    if (POWERON) {
      Serial.println("POWER ON");
      mp3.play(9);                                            //CYCLOTRON START SOUND
      power_cell_start();

      for (int i = 0; i < 10; i++) {
        digitalWrite(SLOBLO, HIGH);
        delay(300);
        digitalWrite(SLOBLO, LOW);
        delay(300);
      }

      digitalWrite(SLOBLO, HIGH);
      POWERON = false;
      mp3.play(11);
    }

    //******************************************** HERE IS THE IDLE STAGE*******************************************************************



    power_cell_idle();
    GREEBLELED.Update(0, 1000);

    barGraphSequenceOne(currentMillis);

    //*************************************************************************************************************************************/


    if (!digitalRead(safety_switch1)) {
      sw11 = true;
      if (sw10) {

        mp3.play(2);// safety sound one

        sw10 = false;
      }
      frontled.Update(0, 800);
      manageSwicth2();
    }
    else {
      sw10 = true;
      if (sw11) {
        mp3.play(13); //click afterwards

        mp3.play(11);


        sw11 = false;
      }
    }



    if (!digitalRead(safety_switch1) && !digitalRead(safety_switch2)) { // BOTH TOGGLE BUTTONS ARE ON
      if (!digitalRead(wandon_switch)) {
        sw31 = true;
        if (sw30) {

          mp3.play(8);// wand on  sound
          sw30 = false;
        }
        managePushButton();

      }
      else {
        sw30 = true;
        if (sw31) {

          mp3.play(8); //wand on sound

          sw31 = false;
        }
      }

    }
    /********

          here is where we can now get confused

          if idle sound playing - we can now check safety switch 1

        1      if safety switch 1 (toggle) on, play safety sound1, turn this off and you get a click sound, flash frontflash
          then back into idle mode

          if safety one on we can now read safety 2
        2      if safety two (toggle) on, play safety 2 sound2, flash topflash, turn on box light turn this off we will get a click sound and then return to idle and start again from safety one

        3   if both safetys on, we can now read activate (toggle), if activate on, we get wand_on sound, if activate off we get wand_on sound (same sound) and return to idle sound (safety2 position)

        4     if activate is on safety one on amd safety 2 on,  we can now read fire (push button), if fire button on we play the blast sound (fireing sequence) - speed up cyclotron

        5     if firing for (time), play warning sound, if fire button released at this point, return to (position4) and start again

        6     if firing for (time) play warning sound, if fire not released after more (time) play vent sound and vent sequence, we then return to (position 4)

        7
    */

  }
  else if (digitalRead(BUTTON_ONE) ) {
    POWERON = true;
    if ( POWEROFF) {
      mp3.play(10); //power down  SOUND and turn everything to "off state"
     

      digitalWrite(SLOBLO, LOW);
      power_cell_off();
      digitalWrite(ORANGEFLASH, LOW);
      bargraph_off();
      POWEROFF = false;
    }
  }
}

void  manageSwicth2() {
  if (!digitalRead(safety_switch2)) {
    sw21 = true;
    if (sw20) {
      mp3.play(3);
      sw20 = false;
    }
    topled.Update (0, 4000);
    digitalWrite(BOXLIGHT, HIGH);

  }
  else {
    sw20 = true;
    if (sw21) {
      mp3.play(13); //click afterwards
      digitalWrite(BOXLIGHT, LOW);
      digitalWrite(TOPFLASH, LOW);
      mp3.play(11);

      sw21 = false;

      topled.Update (0, 0);
      digitalWrite(BOXLIGHT, LOW);
    }
  }
}
void  managePushButton() {
  unsigned long currentMillis = millis();
  if (!digitalRead(blast)) {

    sw41 = true;
    if (sw40) {
      mp3.play(6);// BLAST
     
      Serial.println("blast timer starting now");
      sw40 = false;
    }
    unsigned long currentMillis = millis();
    barrelled.Update(0, 20);
    barGraphSequenceTwo(currentMillis);
    barrelled.Update(0, 10);
    blastTime();
  
  }
  else {
   
    blast_speed = 8;
    sw40 = true;
    if (sw41) {
      mp3.play(7);
      digitalWrite(BARRELFLASHER, LOW);

      delay(800);
      sw41 = false;
      mp3.play(11);
    }
  }
}





/*************** Bar Graph Animations *********************/
// This is the idle sequence
unsigned long prevBarMillis_on = 0;   // bargraph on tracker
const int pwrcl_interval = 40;     // interval at which to cycle lights (milliseconds).
bool reverseSequenceOne = false;

void barGraphSequenceOne(int currentMillis) {
  // normal sync animation on the bar graph
  if (currentMillis - prevBarMillis_on > pwrcl_interval) {
    // save the last time you blinked the LED
    prevBarMillis_on = currentMillis;

    if ( reverseSequenceOne == false ) {
      switch_graph_led(seq_1_current, HIGH);
      seq_1_current++;
      if ( seq_1_current > num_led ) {
        reverseSequenceOne = true;
      }
    } else {
      switch_graph_led(seq_1_current, LOW);
      seq_1_current--;
      if ( seq_1_current < 0  ) {
        reverseSequenceOne = false;
      }
    }
  }
}

// This is the firing sequence
unsigned long prevBarMillis_fire = 0; // bargraph firing tracker
int fireSequenceNum = 1;

void barGraphSequenceTwo(int currentMillis) {
  if (currentMillis - prevBarMillis_fire > firing_interval) {
    // save the last time you blinked the LED
    prevBarMillis_fire = currentMillis;

    switch (fireSequenceNum) {
      case 1:
        switch_graph_led(2, LOW);
        switch_graph_led(14, LOW);
        switch_graph_led(1, HIGH);
        switch_graph_led(15, HIGH);
        fireSequenceNum++;
        break;
      case 2:
        switch_graph_led(1, LOW);
        switch_graph_led(15, LOW);
        switch_graph_led(2, HIGH);
        switch_graph_led(14, HIGH);
        fireSequenceNum++;
        break;
      case 3:
        switch_graph_led(2, LOW);
        switch_graph_led(14, LOW);
        switch_graph_led(3, HIGH);
        switch_graph_led(13, HIGH);
        fireSequenceNum++;
        break;
      case 4:
        switch_graph_led(3, LOW);
        switch_graph_led(13, LOW);
        switch_graph_led(4, HIGH);
        switch_graph_led(12, HIGH);
        fireSequenceNum++;
        break;
      case 5:
        switch_graph_led(4, LOW);
        switch_graph_led(12, LOW);
        switch_graph_led(5, HIGH);
        switch_graph_led(11, HIGH);
        fireSequenceNum++;
        break;
      case 6:
        switch_graph_led(5, LOW);
        switch_graph_led(11, LOW);
        switch_graph_led(6, HIGH);
        switch_graph_led(10, HIGH);
        fireSequenceNum++;
        break;
      case 7:
        switch_graph_led(6, LOW);
        switch_graph_led(10, LOW);
        switch_graph_led(7, HIGH);
        switch_graph_led(9, HIGH);
        fireSequenceNum++;
        break;
      case 8:
        switch_graph_led(7, LOW);
        switch_graph_led(9, LOW);
        switch_graph_led(6, HIGH);
        switch_graph_led(10, HIGH);
        fireSequenceNum++;
        break;
      case 9:
        switch_graph_led(6, LOW);
        switch_graph_led(10, LOW);
        switch_graph_led(5, HIGH);
        switch_graph_led(11, HIGH);
        fireSequenceNum++;
        break;
      case 10:
        switch_graph_led(5, LOW);
        switch_graph_led(11, LOW);
        switch_graph_led(4, HIGH);
        switch_graph_led(12, HIGH);
        fireSequenceNum++;
        break;
      case 11:
        switch_graph_led(4, LOW);
        switch_graph_led(12, LOW);
        switch_graph_led(3, HIGH);
        switch_graph_led(13, HIGH);
        fireSequenceNum++;
        break;
      case 12:
        switch_graph_led(3, LOW);
        switch_graph_led(13, LOW);
        switch_graph_led(2, HIGH);
        switch_graph_led(14, HIGH);
        fireSequenceNum = 1;
        break;
    }
  }
}

/************************* Shutdown and helper functions ****************************/
void shutdown_leds() {
  // reset the sequence
  seq_1_current = 1;
  fireSequenceNum = 1;

  // shut all led's off
  for (int i = 1; i <= 15; i++) {
    switch_graph_led(i, LOW);
  }
}

void switch_graph_led(int num, int state) {
  switch (num) {
    case 1:
      io.digitalWrite(BAR_01, state);
      break;
    case 2:
      io.digitalWrite(BAR_02, state);
      break;
    case 3:
      io.digitalWrite(BAR_03, state);
      break;
    case 4:
      io.digitalWrite(BAR_04, state);
      break;
    case 5:
      io.digitalWrite(BAR_05, state);
      break;
    case 6:
      io.digitalWrite(BAR_06, state);
      break;
    case 7:
      io.digitalWrite(BAR_07, state);
      break;
    case 8:
      io.digitalWrite(BAR_08, state);
      break;
    case 9:
      io.digitalWrite(BAR_09, state);
      break;
    case 10:
      io.digitalWrite(BAR_10, state);
      break;
    case 11:
      io.digitalWrite(BAR_11, state);
      break;
    case 12:
      io.digitalWrite(BAR_12, state);
      break;
    case 13:
      io.digitalWrite(BAR_13, state);
      break;
    case 14:
      io.digitalWrite(BAR_14, state);
      break;
    case 15:
      io.digitalWrite(BAR_15, state);
      break;
  }
}
void  blastTime() {
  unsigned long blastMillis = millis();
  if (blastMillis - preBlastMillis >= blast_interval) {
    // save the last time you blinked the LED
    preBlastMillis = blastMillis;
    blast_speed--;
    if (blast_speed <= 0)blast_speed = 0;
    if (blast_speed >= 8)blast_speed = 8;
    Serial.println("blast_speed (this should appear every 15 secs of hold) let me know if otherwise happes):");
    Serial.println(blast_speed );
  }
}
