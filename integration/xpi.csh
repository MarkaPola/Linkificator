#!/bin/csh -f

#
# Build Firefox add-on xpi package with some extensions
#
if (! -f package.json) then
	echo "Must be executed from the root directory of the add-on";
	exit 1;
endif

python ${ADDON_HOME_PATH}/bin/cfx xpi --templatedir=app-extension

zip -r linkificator.xpi chrome chrome.manifest options.xul defaults/preferences/prefs.js

set version=`cat package.json | perl -e 'use JSON; undef $/; my $text=<STDIN>; $/ = "\n"; print from_json($text)->{"version"};'`

echo "Renaming extension to linkificator${version}.xpi"
mv linkificator.xpi linkificator${version}.xpi

