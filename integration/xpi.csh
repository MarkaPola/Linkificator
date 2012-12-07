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

#
# patch options.xul for a correct UI behavior
#
set TDIR = ${TMP}/$$
if (! -d $TDIR) mkdir $TDIR
unzip -p linkificator.xpi options.xul > ${TDIR}/options.orig.xul
cat ${TDIR}/options.orig.xul | sed 's/<menulist/<menulist sizetopopup="always"/' > ${TDIR}/options.xul
zip -r -j linkificator.xpi ${TDIR}/options.xul
rm -rf ${TDIR}

#
# Add chrome extensions and custom version of preferences
#
zip -r linkificator.xpi chrome chrome.manifest defaults/preferences/prefs.js

set version=`cat package.json | perl -e 'use JSON; undef $/; my $text=<STDIN>; $/ = "\n"; print from_json($text)->{"version"};'`

echo "Renaming extension to linkificator${version}.xpi"
mv linkificator.xpi linkificator${version}.xpi

