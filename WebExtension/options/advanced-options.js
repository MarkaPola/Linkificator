

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// author: MarkaPola

//
// Manage the options page of the add-on
//

// utility functions
function $ (id) {
	return document.getElementById(id);
}

function openTab (event, tabName) {
    let tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the link that opened the tab
    document.getElementById(tabName).style.display = "block";
    event.currentTarget.className += " active";
}

$('tab-links').addEventListener('click', event => openTab(event, 'links'));
$('tab-custom-rules').addEventListener('click', event => openTab(event, 'custom-rules'));
$('tab-configuration').addEventListener('click', event => openTab(event, 'configuration'));

// Select default tab
openTab({currentTarget: $('tab-links')}, 'links');
