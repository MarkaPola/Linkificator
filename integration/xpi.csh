#!/bin/csh -f
#
# Build Firefox add-on xpi package with some extensions
#

if ("$*" == "--help") then
	python ${ADDON_HOME_PATH}/bin/cfx --help
	exit 0;
endif

if (! -f package.json) then
	echo "Must be executed from the root directory of the add-on";
	exit 1;
endif

set CFX_VERSION = `python ${ADDON_HOME_PATH}/bin/cfx --version | gawk '{print $3*100;}'`

set APP_EXTENSION = ${ADDON_HOME_PATH}/app-extension
if (-d ${ADDON_HOME_PATH}/python-lib/cuddlefish/app-extension) then
	set APP_EXTENSION = ${ADDON_HOME_PATH}/python-lib/cuddlefish/app-extension
endif
cp -f ${APP_EXTENSION}/{application.ini,bootstrap.js} app-extension

#
# packaging add-on
#
python ${ADDON_HOME_PATH}/bin/cfx xpi --templatedir=app-extension $*

#
# patch options.xul for a correct UI behavior
#
set TDIR = ${TMP}/$$
if (! -d $TDIR) mkdir $TDIR
unzip -p linkificator.xpi options.xul > ${TDIR}/options.orig.xul
cat ${TDIR}/options.orig.xul | sed 's/<menulist/<menulist sizetopopup="always"/' > ${TDIR}/options.xul
zip -j linkificator.xpi ${TDIR}/options.xul
rm -rf ${TDIR}

if ($CFX_VERSION < 115) then
	#
	# Add chrome extensions and custom version of preferences
	#
	zip -r linkificator.xpi chrome chrome.manifest
endif
#
# Add custom version of preferences
#
zip linkificator.xpi defaults/preferences/prefs.js

set version=`cat package.json | perl -e 'use JSON; undef $/; my $text=<STDIN>; $/ = "\n"; print from_json($text)->{"version"};'`

echo "Renaming extension to linkificator${version}.xpi"
mv linkificator.xpi linkificator${version}.xpi

