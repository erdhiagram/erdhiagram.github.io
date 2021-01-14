var firebaseConfig = {
    apiKey: "AIzaSyARsnp1Ah5MduW-a7pQ81CS9nki3hwO1cU",
    authDomain: "livechat-application.firebaseapp.com",
    databaseURL: "https://livechat-application.firebaseio.com",
    projectId: "livechat-application",
    storageBucket: "livechat-application.appspot.com",
    messagingSenderId: "553912516268",
    appId: "1:553912516268:web:c7a8bdc0ad52e01c522909",
    measurementId: "G-S232WR9L89"
};
firebase.initializeApp(firebaseConfig);

var $messages = $('.messages-content'),
    d, h, m,
    i = 0;

var getRef = null;
var getName = null;
var chatRef = null;
var getDrName = null;
var getPatientName = null;
var senderName = "";
var receiverName = "";
var checkingChatRef;

$(document).ready(function () {
    getRef = gup('refKey', window.location.href);
    getName = gup('patient', window.location.href);

    if(getRef){
        chatRef = getRef;
        $("#user-name").text('Patient: ' + getName);

        loadMessage();
    }else{
        $('#exampleModal').modal('show');

        $("#btn-start-chat").click(function () {
            $('#exampleModal').modal('hide');

            $("#user-name").text('Doctor: ' + $("#select-dokter option:selected").text());
            getDrName = $("#select-dokter option:selected").text();
            getPatientName = $("#input-name").val();

            if (getPatientName) {
                senderName = getPatientName;
                receiverName = getDrName;

                loadMessage();
            } else {
                $.alert('Anda belum memasukkan nama', 'Alert');
            }
        });
    }
});

function loadMessage() {
    $.showPreloader('Connecting, please wait...');

    if(getRef){
        getChatID(getRef);

        firebase.database().ref('chats').child(chatRef).on("value", function(snapshot) {
            senderName = snapshot.val().doctor;
            receiverName = snapshot.val().patient;
        });
    }else{
        firebase.database().ref('chats').orderByChild('filter').equalTo(getDrName + '||' + getPatientName).on("value", function (snapshot) {
            if (snapshot.exists()) {
                getChatID(Object.keys(snapshot.val())[0]);
            } else {
                chatRef = firebase.database().ref("chats").push().set({
                    "doctor": getDrName,
                    "doctor_id": 1,
                    "patient": getPatientName,
                    "patient_id": 1,
                    "filter": getDrName + '||' + getPatientName,
                    "filter_id": 1 + '||' + 2
                });
            }
        });
    }

    setTimeout(function(){
        loadChat();
    }, 3000);
}

function loadChat(){
    if(senderName){
        if(JSON.stringify(chatRef) !== 'null'){
            if (JSON.stringify(chatRef) !== "{}") {
                $.hidePreloader();

                $messages.mCustomScrollbar();

                firebase.database().ref("chats").child(chatRef).child("messages").on("child_added", function (snapshot) {
                    var date = convertTime(snapshot.val().sent);

                    if (snapshot.val().sender == senderName) {
                        $('<div class="message message-personal shadow"><div id="message-' + snapshot.key + '" style="white-space: pre-line" onclick=openMsgOpt("' + snapshot.key + '","' + encodeURIComponent(snapshot.val().message) + '")>' + snapshot.val().message + '<div class="timestamp">' + date + '</div></div></div>').appendTo($('.mCSB_container')).addClass('new');
                        $('.message-input').val(null);
                    } else {
                        $('<div class="message new shadow"><div id="message-' + snapshot.key + '" style="text-align: left !important;"><font color="#4E73DF"><b>' + snapshot.val().sender + '</b></font><br/> ' + snapshot.val().message + '</div><div class="timestamp">' + date + '</div></div>').appendTo($('.mCSB_container')).addClass('new');
                    }

                    updateScrollbar();
                });

                firebase.database().ref("chats").child(chatRef).child("messages").on("child_removed", function (snapshot) {
                    document.getElementById("message-" + snapshot.key).innerHTML = "<font color='#F6C23E'>This message has been deleted</font>";
                });
            }else{
                loadMessage();
            }
        }else{
            loadMessage();
        }
    }else{
        loadMessage();
    }
}

function getChatID(id) {
    chatRef = id;
}

function updateScrollbar() {
    $messages.mCustomScrollbar("update").mCustomScrollbar('scrollTo', 'bottom', {
        scrollInertia: 10,
        timeout: 0
    });
}

function deleteMessage(messageId) {
    firebase.database().ref("chats").child(chatRef).child("messages").child(messageId).remove();

    $.toast('Deleted successfully', 1000);
}

function sendMessage() {
    var message = document.getElementById("message").value;
    firebase.database().ref("chats").child(chatRef).child("messages").push().set({
        "message": message,
        "sender": senderName,
        "sender_id": 1,
        "sender_type": "patient",
        "receiver": receiverName,
        "receiver_id": 1,
        "receiver_type": "doctor",
        "booking_id": 1,
        "session": "Sesi 1 (09:00 - 10:00)",
        "date": "2020-08-31",
        "sent": firebase.database.ServerValue.TIMESTAMP
    });
    return false;
}

function insertMessage() {
    msg = $('.message-input').val();
    if ($.trim(msg) == '') {
        return false;
    }

    sendMessage();
}

$('.message-submit').click(function () {
    insertMessage();
});

function openMsgOpt(id, msg) {
    firebase.database().ref("chats").child(chatRef).child("messages").child(id).once("value", snapshot => {
        if (snapshot.exists()) {
            showOpt(id, msg);
        } else {
            $.alert('Message has been deleted', 'Alert');
        }
    });
}

function showOpt(id, msg) {
    $.actions([
        [
            {
                text: decodeURIComponent(msg),
                close: false,
                disabled: true,
            }
        ],

        [
            {
                text: 'Delete message',
                onClick: function () {
                    $.confirm('Are you sure want to delete this message?', 'Alert', function () {
                        $.showPreloader('Deleting, please wait...');

                        setTimeout(function () {
                            $.hidePreloader();
                            deleteMessage(id);
                        }, 1000)

                    });
                }
            },
            {
                text: 'Copy message',
                onClick: function () {
                    copyMessage(msg);
                }
            }
        ],

        [
            {
                text: 'Close',
                bold: true,
                color: '#999DA0',
            }
        ],

    ]);
}

function copyMessage(copyText) {
    $.toast('Message copied', 1000);

    var input = document.createElement('textarea');
    input.innerHTML = decodeURIComponent(copyText);
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input);
    return result;
}

function gup(name, url) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

function checkTime(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

function convertTime(epoch) {
    var sent = new Date(epoch);
    var h = sent.getHours();
    var m = sent.getMinutes();
    m = checkTime(m);

    return h + ":" + m;
}
