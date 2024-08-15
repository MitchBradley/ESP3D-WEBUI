# WebUI Development and Test

## Compiling

WebUI is compiled with the "gulp" packager program (https://gulpjs.com/docs/en/getting-started/quick-start) that runs on top of nodejs.


Complete process for building using CMD (run as administrator) on Windows 11:

You may need to change Windows security settings temporarily using Powershell (run as admin)
```
Get-ExecutionPolicy -List
Set-ExecutionPolicy RemoteSigned -Scope Process
```
Press 'y'

Install gulp
```
npm install --global gulp-cli
```
Go to the folder you want:
```
cd C:\Users\your\folder
```
Clone the repo
```
git clone https://github.com/MitchBradley/ESP3D-WEBUI.git
```
Go to the root
```
cd ESP3D-WEBUI
```
Update the line in package.json from 0.0.1 to:
```
"gulp-filesize": "^0.0.6",
```
Install dependencies
```
npm install
```
Get submodule updates
```
git submodule update --init
```
Build the index.html.gz
```
gulp package --lang en
```

Revert the security settings in Powershell
```
Set-ExecutionPolicy Restricted -Scope Process
Get-ExecutionPolicy -List
```




That will create an "index.html.gz" file in the top directory, and an non-compressed
version in "dist/index.html".

If you omit `--lang en`, it will create a file with support for many different languages,
but the file will probably be too large to fit on an ESP32's local flash filesystem.
A single alternative language might fit.  For example, you could add German support
with `gulp package --lang de`

## Testing

You can upload index.html.gz to a FluidNC ESP32 machine and run it
from there by browsing to the FluidNC IP address.  That is the normal
way of using WebUI.

If you're testing on a physical FluidNC machine and you break the page, you can delete the old index.html.gz file in the terminal serial monitor using
```
$Localfs/Delete=index.html.gz
```
Refreshing the page will give a default page that allows you to upload a new file

Alternatively, for a quicker test of a new build, you can avoid the upload step by
starting a proxy server with:

```
$ python fluidnc-web-sim.py
```

Then browse to "localhost:8080" instead of directly to the FluidNC IP address.

The proxy serves the "dist/index.html" file directly for the initial
load of WebUI, bypassing the FluidNC system for the index file.  The
proxy forwards all other communication over to the FluidNC machine.

By default, the proxy tries to find the FluidNC machine by using MDNS
to "fluidnc.local".  If that does not work, you can supply the FluidNC
IP address on the command line, as with:

```
$ python fluidnc-web-sim.py 192.168.1.25
```

