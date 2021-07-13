from picamera import PiCamera
from os import system
import datetime
from time import sleep
import json


def get_config():
    file_object = open("config.json", "r")
    json_content = file_object.read()
    return json.loads(json_content)


config = get_config()

num_photos = int((config['minutesToRun'] * 60) / config['interval'])

print("number of photos to take:", num_photos)

date_raw = datetime.datetime.now()
datetime_format = date_raw.strftime("%Y-%m-%d_%H:%M")
dir_name = '/home/pi/timelapse/' + datetime_format
print("RPi started taking photos for your timelapse at:", datetime_format)

camera = PiCamera()
camera.resolution = (config['camResX'], config['camResY'])
camera.rotation = config['camRotation']

system('mkdir ' + dir_name)

for i in range(num_photos):
    camera.capture(dir_name + '/image{0:06d}.jpg'.format(i))
    sleep(config['interval'])
    print("Photo:", str(i + 1))

print("Done taking photos.")