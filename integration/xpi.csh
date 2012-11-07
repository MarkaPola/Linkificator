#!/bin/csh -f

#
# Build Firefox add-on xpi package with some extensions
#
if (! -f package.json) then
	echo "Must be executed from the root directory of the add-on";
	exit 1;
endif

set APP_EXTENSION = ${ADDON_HOME_PATH}/app-extension
if (-d ${ADDON_HOME_PATH}/python-lib/cuddlefish/app-extension) then
	set APP_EXTENSION = ${ADDON_HOME_PATH}/python-lib/cuddlefish/app-extension
endif
cp -f ${APP_EXTENSION}/{application.ini,bootstrap.js} app-extension

python ${ADDON_HOME_PATH}/bin/cfx xpi --templatedir=app-extension

zip -r linkificator.xpi chrome chrome.manifest options.xul defaults/preferences/prefs.js

set version=`cat package.json | perl -e 'use JSON; undef $/; my $text=<STDIN>; $/ = "\n"; print from_json($text)->{"version"};'`

echo "Renaming extension to linkificator${version}.xpi"
mv linkificator.xpi linkificator${version}.xpi

