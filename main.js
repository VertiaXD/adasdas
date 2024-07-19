if (typeof chatList !== 'undefined')
{
	chatList = true;
}
else
{
	chatList = false;
}

if (typeof alfaSMS !== 'undefined')
{
	alfaSMS.init("chat");

	$(document).ready(function ()
	{
		$(document).on("click", ".btn-chat-sms, .chatMobileDropdown .btn-sms-gonder", function ()
		{
			//const id = $(this).attr("data-id");
			const id = $("input[name=receiverID]").val();
			const username = $(this).data("name");
			const data = {
				id : id,
				username : username
			};
			alfaSMS.showModal("chat", data);
		});
	});
}

// document.querySelector(".userListMessage").innerHTML = localStorage.getItem("chatListHTML");


var aylarArray = [ "Ocak", "Åžubat", "Mart", "Nisan", "MayÄ±s", "Haziran", "Temmuz", "AÄŸustos", "EylÃ¼l", "Ekim", "KasÄ±m", "AralÄ±k" ];
var tempMsg = "";
var shortcutlist = [];

function stripTags(input)
{
	var tempDiv = document.createElement("div");
	tempDiv.innerHTML = input;
	return tempDiv.textContent || tempDiv.innerText || "";
}

function renderAutoComplete(list)
{
	if ($("#ChatMessage").length == 0 || list.length == 0)
	{
		return;
	}
	try
	{
		console.log("Render");
		$("#ChatMessage").autocomplete({
			minLength : 0,
			source : list.map(li => ({
				label : li.shortcut,
				value : li.content,
				content : li.content,
				shortcut : li.shortcut
			})),
			focus : function (event, ui)
			{
				$("#ChatMessage").val(ui.item.content);
				return false;
			},
			select : function (event, ui)
			{
				$("#ChatMessage").val(ui.item.content);
				return false;
			}
		})
		                 .autocomplete("instance")._renderItem = function (ul, item)
		{

			return $("<li>")
			.append("<div class='shortcut-card'><b class='shortcut-key'>" + item.shortcut + "</b><span class='shortcut-content'>" + item.content + "</span></div>")
			.appendTo(ul);
		};
	}
	catch (e)
	{
		console.log("Hata");
		console.log(e);
	}
}

async function checkUserSMSAvailable(userId)
{
	return new Promise((resolve, reject) =>
	{
		$.ajax({
			url : `api/checkUserSMSAvailable?id=${ userId }`,
			type : "GET",
			success : function (data)
			{
				resolve(data.available);
			},
			error : function (data)
			{
				resolve(null);
			}
		});
	});
}

async function checkChatSMSVisible(userID, userName)
{
	if ([ 0, 1 ].includes(+userID))
	{
		$(".btn-chat-sms").removeClass("visible");
		return;
	}
	const available = await checkUserSMSAvailable(userID);
	if (!available)
	{
		$(".btn-chat-sms").removeClass("visible");
		return;
	}
	$(".btn-chat-sms").addClass("visible").attr("data-id", userID);
}

const userShopping = {
	_userId : 0, _userName : "", _list : [], _count : 0, get count()
	{
		return this._count;
	}, userChanged : function ({ id, name })
	{
		this.onShopClose();
		this.onPageClose();
		this._userId = id;
		this._userName = name;
		this._list = [];
		this._count = 0;
		this.getCount().catch();
		this.onPageOpen();
	}, reset : function ()
	{
		this._list = [];
		this.setCount(0);
	}, setList : function (list)
	{
		this._list = list;
		this.renderList();
	}, getCount : async function ()
	{
		this.setCount(0);

		return false;
		pageLoading();
		const resp = await fetch(`/api/getShopRelationSummaryCount?UserId=${ this._userId }`);
		const data = await resp.json();
		pageLoaded();
		if (data.status === 200)
		{
			this.setCount(data?.details?.count);
		}
	}, setCount : function (count)
	{
		this._count = count;
		$(".btn.btn-shopping .shopping-number").html(count);
	}, getList : async function ()
	{
		pageLoading();
		const resp = await fetch(`/api/getShopRelationSummary?UserId=${ this._userId }&Filter=all`);
		const data = await resp.json();
		pageLoaded();
		if (data.status === 200)
		{
			this.setList(data?.details);
		}
		console.log('get list data: ', data);
	}, onChange : function ()
	{
	}, changeVisibility : function (isVisible)
	{
		if (isVisible)
		{
			$(".btn.btn-shopping").addClass("visible");
		}
		else
		{
			$(".btn.btn-shopping").removeClass("visible");
		}
	}, onPageOpen : function ()
	{
		this.changeVisibility(true);
	}, onPageClose : function ()
	{
		this.changeVisibility(false);
	}, onShopOpen : function ()
	{
		$(".btn.btn-shopping").addClass("active");
		$(".shopping-relation-provider").addClass("visible");
		this.getList().catch();
	}, onShopClose : function ()
	{
		$(".btn.btn-shopping").removeClass("active");
		$(".shopping-relation-provider").removeClass("visible");
	}, renderDate : function (date)
	{
		const dateObj = new Date(date);
		return `${ dateObj.getDate() } ${ aylarArray[dateObj.getMonth()] } ${ dateObj.getFullYear() }`;
	}, writeMessage : function (item)
	{
		if (item.itsBuy)
		{
			return `<b>${ item.Id }</b> sipariÅŸ numarasÄ±yla <a href="${ item.postUrl }" target="_blank" class="shopping-item-name">${ item.Title }</a> baÅŸlÄ±klÄ± ilanÄ± <b>${ this.renderDate(item.Datetime) }</b> tarihinde <b>${ item.Price } â‚º</b> karÅŸÄ±lÄ±ÄŸÄ±nda satÄ±n aldÄ±nÄ±z.`;
		}

		return `<b>${ item.Id }</b> sipariÅŸ numarasÄ±yla <a href="${ item.postUrl }" target="_blank" class="shopping-item-name">${ item.Title }</a> baÅŸlÄ±klÄ± ilan <b>${ this.renderDate(item.Datetime) }</b> tarihinde <b>${ this._userName }</b> tarafÄ±ndan <b>${ item.Price } â‚º</b> karÅŸÄ±lÄ±ÄŸÄ±nda satÄ±n alÄ±nmÄ±ÅŸtÄ±r.`;
	}, renderStock : function (item)
	{
		if (!item.StockValue || item.StockValue.length <= 0)
		{
			return '';
		}
		return `<br/><br/>
				SipariÅŸte Teslim Edilen ÃœrÃ¼n:
				<br/>
				<b>${ item.StockValue }</b>`;
	}, renderList : function ()
	{
		const list = this._list;
		const listElement = document.getElementById("shopping-relation-list");
		listElement.innerHTML = "";

		const el = document.createElement("div");
		el.classList.add("shopping-label");
		el.innerHTML = "AlÄ±ÅŸveriÅŸ GeÃ§miÅŸi";
		listElement.appendChild(el);

		list.forEach((item) =>
		{
			const element = document.createElement("div");
			element.classList.add("shopping-item");
			element.classList.add(item.itsBuy ? "its-buy" : "its-sell");
			const content = document.createElement("div");
			content.classList.add("shopping-content");
			content.innerHTML = `<div class="shopping-item-image">
				<a href="${ item.postUrl }" target="_blank"><img src="${ item.AdvertImage }" alt="${ item.Title }"></a>
			</div>
			<div class="shopping-item-info">
				${ this.writeMessage(item) }
				<br/>
				<br/>
				SipariÅŸin Son Durumu: 
				<br/><b>${ item.StateText }</b>
				${ this.renderStock(item) }
				
			</div>`;
			element.appendChild(content);
			listElement.appendChild(element);
		});
	}
};

function startChat(UserId, UserName, Avatar, ChatID)
{

	if ($(".topMessageBar.SMS23").length)
	{
		Swal.fire({
			type : "telefon", allowOutsideClick : false, allowEscapeKey : false, showCloseButton : true, confirmButtonText : "Telefon NumaramÄ± DoÄŸrula", html : "<br>" + "<img width='130' src='https://cdn.itemsatis.com/uploads/admin/927261.svg'/><br><br>" + "<h3 class='text-white'>Telefon DoÄŸrulama</h3>" + "Sohbet baÅŸlatabilmek iÃ§in telefon numaranÄ±zÄ± doÄŸrulamanÄ±z gerekmektedir.<br>AÅŸaÄŸÄ±daki butona tÄ±klayarak telefon numaranÄ±zÄ± doÄŸrulayabilirsiniz."
		}).then((result) =>
		{
			if (result.value)
			{
				window.location.assign("/telefon-dogrula.html");
			}
		});
	}
	else if ($(".rightMessages .userListMessage").length)
	{
		if (myDatas.userID == UserId)
		{
			return;
		}

		if (BrowserData.isMobile && !$("body[data-page=Chat]").length)
		{
			window.location.href = "/mesajlarim/" + UserName;
			return false;
		}

		if ($(".rightMessages .userListMessage .chat-user-" + UserId).length)
		{
			$(".rightMessages .userListMessage .chat-user-" + UserId).trigger("click");
		}
		else
		{
			$(".rightMessages .userListMessage").prepend('<li class="chat-user-' + UserId + '" data-username="' + UserName + '" data-avatar="' + Avatar + '" data-chat-id="' + ChatID + '" data-id="' + UserId + '">\n' + '<img data-tooltip="' + UserName + '" data-position="left center" src="' + Avatar + '">\n' + '<span class="receiver-class"><i class="fa fa-check"></i></span>' + '<span class="chat-username">' + UserName + '</span>\n' + '<span class="chat-message"></span>\n' + '<span class="chat-message-time"></span>\n' + '</li>');
			$(".rightMessages .userListMessage .chat-user-" + UserId).trigger("click");
		}
	}
	else
	{
		$(".LoginButton").trigger("click");
	}
}

document.addEventListener("visibilitychange", function ()
{
	if (document.visibilityState === "visible")
	{
		var activeChatId = $("input[name=sendMessageChatID]").val();
		var activeUserName = $("input[name=receiverName]").val();

		if (activeChatId != "0" && activeUserName != "0")
		{
			socket.emit('seenMessages', activeChatId, activeUserName);
		}
	}
});

function getChatList()
{
	socket.emit('getMessageList');
}

function uniqueID()
{
	function chr4()
	{
		return Math.random().toString(16).slice(-4);
	}

	return chr4() + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + chr4() + chr4();
}

function reloadLocalStorage()
{
	var d = new Date();
	localStorage.setItem("chatListLastTime", d.getTime());
	localStorage.setItem("chatListHTML", $(".userListMessage").html());
}

var olderMessageID = 0;
var olderMessage = "";

var getUrlParameter = function getUrlParameter(sParam)
{
	var sPageURL = window.location.search.substring(1), sURLVariables = sPageURL.split('&'), sParameterName, i;

	for (i = 0; i < sURLVariables.length; i++)
	{
		sParameterName = sURLVariables[i].split('=');

		if (sParameterName[0] === sParam)
		{
			return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
		}
	}
};

jQuery.fn.scrollTo = function (elem)
{
	try
	{
		$(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(this).offset().top - 85);
		return this;
	}
	catch (err)
	{
		console.log("Scroll Error : " + err);
	}
};

String.prototype.replaceAll = function (stringToFind, stringToReplace)
{
	if (stringToFind === stringToReplace)
	{
		return this;
	}
	var temp = this;
	var index = temp.indexOf(stringToFind);
	while (index != -1)
	{
		temp = temp.replace(stringToFind, stringToReplace);
		index = temp.indexOf(stringToFind);
	}
	return temp;
};

function strip_html_tags(str)
{
	if ((str === null) || (str === ''))
	{
		return false;
	}
	else
	{
		str = str.toString();
	}
	return str.replace(/<[^>]*>/g, '');
}

function replaceEmoji(text)
{
	/*
	 text = text.replaceAll(":D", "ðŸ˜„");
	 text = text.replaceAll(":d", "ðŸ˜„");
	 text = text.replaceAll(":)", "ðŸ˜Š");
	 text = text.replaceAll(":@", "ðŸ¤¬");
	 text = text.replaceAll("<3", "â¤ï¸");
	 text = text.replaceAll(":P", "ðŸ˜œ");
	 text = text.replaceAll(":p", "ðŸ˜œ");
	 text = text.replaceAll(":O", "ðŸ˜®");
	 text = text.replaceAll(":o", "ðŸ˜®");
	 text = text.replaceAll(":*", "ðŸ˜˜");
	 text = text.replaceAll("itemsatÄ±ÅŸ", "<shine class='shine'>itemsatÄ±ÅŸ</shine>");
	 */
	return text;
}

function isValidImageURL(str)
{
	if (typeof str !== 'string')
	{
		return false;
	}
	return !!str.match(/\w+\.(jpg|jpeg|gif|png)$/gi);
}

function linkify(inputText)
{
	var replacedText, replacePattern1, replacePattern2, replacePattern3;

	//URLs starting with http://, https://, or ftp://
	replacePattern1 = /(\b(https?|http?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
	replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

	//URLs starting with "www." (without // before it, or it'd re-link the ones done above).
	replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
	replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

	return replacedText;
}

var ChatName = "";
var ChatAvatar = "";
var toUserID = 0;

var socket = "";
var messageUserData = {};

var typing = false;
var timeout = undefined;

var user_typing = false;
var user_timeout = undefined;

function getMessageDetails(chatID, letSeen)
{
	socket.emit('getMessageDetails', chatID, letSeen);
	$(".chatMessageList").html('');

	// chat id deÄŸeri 1_ ile baÅŸlÄ±yorsa
	if (chatID.toString().startsWith("1_") || chatID.toString().startsWith("45_"))
	{
		$("#chatSendMessageBox").css("display", "none");
		$("#chatNotSendMessage").css("display", "block");
	}
	else
	{
		$("#chatSendMessageBox").css("display", "block");
		$("#chatNotSendMessage").css("display", "none");
	}
}

function SendMessage()
{
	if (typeof ChatName !== 'undefined')
	{
		var Message = $("#ChatMessage").val();

		if (Message.length < 2)
		{
			$(this).addClass('is-invalid');
			if (!$('#chatSendMessageBox').has('#isInvalidMessage').length)
			{
				$('#chatSendMessageBox').append(`<small class="isInvalidMessage" id="isInvalidMessage">MesajÄ±nÄ±zÄ±n en az 2 karakter olmalÄ±dÄ±r.</small>`);

			}
			return;
		}

		if (Message.length > 500)
		{
			Message = Message.substr(0, 500);
		}

		var Now = Math.floor(Date.now() / 1000);
		/*
		 if(localStorage.getItem("AvaiableStamp") > Now)
		 {
		 Swal.fire({
		 title: 'Hata!',
		 html: "Bu kadar hÄ±zlÄ± mesaj gÃ¶nderemezsiniz.<br>LÃ¼tfen " + (localStorage.getItem("AvaiableStamp") - Now) + " saniye bekleyiniz.",
		 type: 'error',
		 confirmButtonText: 'Tamam'
		 });
		 return false;
		 }
		 */

		var AvaiableStamp = Math.ceil(Date.now() / 1000) + 3;
		localStorage.setItem("AvaiableStamp", AvaiableStamp);

		var UserID = myDatas.userID;
		var UserName = myDatas.userName;
		var toUserID = $("input[name=receiverID]").val();
		var toUserName = $("input[name=receiverName]").val();
		var toUserAvatar = $(".rightMessages .chatMessagePanel .chatPanelHeader img").attr("src");

		document.getElementById("ChatMessage").value = "";
		tempMsg = Message;

		socket.emit('sendMessage', Message, toUserName, UserName, toUserID, UserID, toUserAvatar);
	}
}

/* CHECK MESSAGE WORD LIST */
// const blackWordsList = ['kel', 'mal', 'gerizekalÄ±']

/* CHECK MESSAGE WORD FUNCTION */
const checkMessageEqualsBlackWord = (messageWords) =>
{
	let bannedWordsUsed = messageWords.filter(word => word === blackWordsList[blackWordsList.indexOf(word)]);
	if (+bannedWordsUsed.length > 0)
	{
		$('#buttonSendMessage').attr('disabled', 'disabled');
		$('#ChatMessage').addClass('is-invalid');
		if (!+$('#chatSendMessageBox').has('#isInvalidMessage').length)
		{
			$('#chatSendMessageBox').append(`<small class="isInvalidMessage" id="isInvalidMessage">MesajÄ±nÄ±zÄ±n <i>'${ bannedWordsUsed[0] }'</i> kelimesini iÃ§ermemelidir.</small>`);
		}
		else
		{
			$('#chatSendMessageBox #isInvalidMessage').html(`MesajÄ±nÄ±zÄ±n <i>'${ bannedWordsUsed[0] }'</i> kelimesini iÃ§ermemelidir.`);
		}
	}
	if (+bannedWordsUsed.length === 0)
	{
		$('#chatSendMessageBox #isInvalidMessage').remove();
		$('#ChatMessage').removeClass('is-invalid');
		$('#buttonSendMessage').attr('disabled', false);
		return true;
	}
	return false;
};

const minimizeChatSearchBar = () =>
{
	$(".content .message-search-input").removeClass("chatUserFilter");
	$(".content .message-search-input").addClass("miniChatFilter");
};

const maximizeChatSearchBar = () =>
{
	$(".content .message-search-input").removeClass("miniChatFilter");
	$(".content .message-search-input").addClass("chatUserFilter");
};

const hideSearchBar = () =>
{
	$(".content .message-search-input").removeClass("chatUserFilter");
	$(".content .message-search-input").addClass("hideChatFilter");
};

const showSearchBar = () =>
{
	$(".content .message-search-input").removeClass("hideChatFilter");
	$(".content .message-search-input").addClass("chatUserFilter");
};

const checkResponsive = () =>
{
	if ($(window).width() < 1024)
	{
		hideSearchBar();
	}
	else
	{
		showSearchBar();
	}
};
checkResponsive();
$(window).resize(() =>
{
	checkResponsive();
});

$(".content .message-search-input").on("click", (e) =>
{
	if (e.target == document.querySelector(".content .miniChatFilter") || e.target.parentElement == document.querySelector(".content .miniChatFilter"))
	{
		maximizeChatSearchBar();
	}
});

$(window).on("click", (e) =>
{
	if (e.target !== document.querySelector(".content .fa.fa-search.search-icon") && e.target !== document.querySelector(".content .chat-user-filter.quicksearch") && e.target !== document.querySelector(".content .miniChatFilter") && e.target.parentElement !== document.querySelector(".content .miniChatFilter") && $(".content .message-search-input").hasClass("chatUserFilter"))
	{
		minimizeChatSearchBar();
	}
});


$('#ChatMessage').keyup(function (e)
{
	if (!checkMessageEqualsBlackWord($(this).val().split(' ')))
	{
		return false;
	}
	if ((+$(this).attr('maxlength') === $(this).val().length) && !(e.keyCode === 13 || e.keyCode === 8))
	{
		$(this).addClass('is-invalid');
		if (!$('#chatSendMessageBox').has('#isInvalidMessage').length)
		{
			$('#chatSendMessageBox').append(`<small class="isInvalidMessage" id="isInvalidMessage">MesajÄ±nÄ±zÄ±n karakter sayÄ±sÄ± ${ $(this).attr('maxlength') }'i geÃ§emez.</small>`);
		}
	}
	else if ($(this).hasClass('is-invalid'))
	{
		$(this).removeClass('is-invalid');
		$('#isInvalidMessage').remove();
		$('#buttonSendMessage').attr('disabled', false);
	}
	if (e.which != 13)
	{
		if (typing == false)
		{
			var chatID = $("input[name=sendMessageChatID]").val();
			var userName = $("input[name=receiverName]").val();
			typing = true;
			socket.emit('typinguser', chatID, userName);
			clearTimeout(timeout);
			timeout = setTimeout(typingTimeout, 3000);
		}
	}
	else
	{
		clearTimeout(timeout);
		typingTimeout();
		SendMessage();
	}
});

function typingTimeout()
{
	typing = false;
}

function typingTimeoutUser()
{
	user_typing = false;
	$(".userTyping").remove();
}

$(".newMessageBtn").on("click", function ()
{
	newMessageButton();
});

$(".chat-user-filter").on("keyup", function (e)
{
	const filterWord = e.target.value.toLowerCase();

	if ($(".btn-full-message").length)
	{
		if (filterWord.length > 0)
		{
			$(".btn-full-message").css("display", "none");
		}
		else
		{
			$(".btn-full-message").css("display", "unset");
		}
	}

	const userList = document.querySelector(".userListMessage");
	let users = [ ...userList.children ];
	let searchResultCount = 0;
	users.forEach(user =>
	{
		if (!!!user.getAttribute('data-username'))
		{
			return false;
		}
		let userName = user.getAttribute("data-username");
		if (filterWord !== '' && userName.toLowerCase().indexOf(filterWord) === -1)
		{
			user.setAttribute("style", "display: none;");
			searchResultCount--;
		}
		else
		{
			$(".notFountChatUser").remove();
			searchResultCount++;
			user.setAttribute("style", "display: block");
		}
		if (searchResultCount === -1 * users.length)
		{
			$(".userListMessage").append("<div class='notFountChatUser'><img src='dist/img/medals/wrong.png' width='70' alt=''/><h4 class='text-center'>AradÄ±ÄŸÄ±nÄ±z kiÅŸi ile sohbetiniz bulunamadÄ±.</h4></div>");
		}
	});
});

async function newMessageButton()
{
	if ($(".topMessageBar.SMS").length)
	{
		Swal.fire({
			type : "telefon", allowOutsideClick : false, allowEscapeKey : false, showCloseButton : true, confirmButtonText : "Telefon NumaramÄ± DoÄŸrula", html : "<br>" + "<img width='130' src='https://cdn.itemsatis.com/uploads/admin/927261.svg'/><br><br>" + "<h3 class='text-white'>Telefon DoÄŸrulama</h3>" + "Sohbet baÅŸlatabilmek iÃ§in telefon numaranÄ±zÄ± doÄŸrulamanÄ±z gerekmektedir.<br>AÅŸaÄŸÄ±daki butona tÄ±klayarak telefon numaranÄ±zÄ± doÄŸrulayabilirsiniz."
		}).then((result) =>
		{
			if (result.value)
			{
				window.location.assign("/telefon-dogrula.html");
			}
		});
	}
	else
	{
		const { value : UserName } = await Swal.fire({
			title : 'Sohbet oluÅŸtur', html : "AÅŸaÄŸÄ±da bulunan metin alanÄ±na,<br>sohbet oluÅŸturmak istediÄŸiniz Ã¼ye adÄ±nÄ± girebilirsiniz.", input : 'text', showCancelButton : true, cancelButtonText : "Ä°ptal", confirmButtonText : "Sohbeti oluÅŸtur", inputPlaceholder : 'Sohbet etmek istediÄŸiniz Ã¼ye adÄ±nÄ± giriniz..', customClass : {
				container : 'container-class special-message'
			}
		});

		if (UserName)
		{
			if (deviceIsMobile)
			{
				myApp.preloader.show();
			}
			else
			{
				pageLoading();
			}

			if (deviceIsMobile)
			{
				var apiURL = "https://www.itemsatis.com/";
			}
			else
			{
				var apiURL = "";
			}

			$.ajax({
				type : 'POST', url : apiURL + 'api/startChatUser', data : "UserName=" + UserName, success : function (data)
				{
					if (deviceIsMobile)
					{
						myApp.preloader.hide();
					}
					else
					{
						pageLoaded();
					}
					data = JSON.parse(data);
					if (data.success === false)
					{
						Swal.fire({
							title : 'Hata!', html : data.message, type : 'error', confirmButtonText : 'Tamam'
						});
					}
					if (data.success === true)
					{
						startChat(data.datas.Id, data.datas.UserName, data.datas.Avatar, data.datas.chatID);
					}
				}
			});
		}
	}
}

function messageStartParameter(userName)
{
	pageLoading();
	$.ajax({
		type : 'POST', url : 'api/startChatUser', data : "UserName=" + userName, success : function (data)
		{
			pageLoaded();
			data = JSON.parse(data);
			if (data.success === false)
			{
				Swal.fire({
					title : 'Hata!', html : data.message, type : 'error', confirmButtonText : 'Tamam'
				});
			}
			if (data.success === true)
			{
				startChat(data.datas.Id, data.datas.UserName, data.datas.Avatar, data.datas.chatID);
			}
		}
	});
}

$(".buttonSendMessage").on("click", function ()
{
	SendMessage();
});

$(".btnOpenMessageList").on("click", function ()
{
	if ($(".rightMessages").hasClass("open"))
	{
		$(".btnOpenMessageList").html('<i class="fas fa-comments"></i>');
		$(".rightMessages").removeClass("open");
		$(".rightMessages").removeClass("onlyList");
	}
	else
	{
		$(".newMessageBtn").html('<i class="fas fa-plus"></i>');
		$(".btnOpenMessageList").html('<i class="fas fa-times"></i>');
		$(".rightMessages").addClass("open");
		$(".rightMessages").addClass("onlyList");

		if ($(".rightMessages").hasClass("fetched"))
		{
		}
		else
		{
			$(".rightMessages").addClass("fetched");
			getChatList();
		}
	}

	$("input[name=receiverName]").val("");
	$("input[name=receiverID]").val("");
	$("input[name=sendMessageChatID]").val("");

	$(".rightMessages ul").scrollTop(0);
});

$(document).on("click", ".rightMessages ul.userListMessage li", function ()
{
	if ($(this).hasClass("LoadingChat") === true)
	{
		return;
	}

	if ($(".rightMessages").hasClass("onlyList"))
	{
		$(".rightMessages").removeClass("onlyList");
	}

	user_typing = false;
	$(".userTyping").remove();

	var chatPanelState = $(".rightMessages").hasClass("open");
	if (chatPanelState == false)
	{
		$(".rightMessages").addClass("open");
		$(".btnOpenMessageList").html('<img src="https://cdn.itemsatis.com/global/icons/arrow-back-outline.svg" width="25"/>');
	}
	$(".newMessageBtn").css("display", "none");


	$(".chatMessageList").addClass("Loading");

	var userID = $(this).data("id");
	var chatID = $(this).data("chat-id");
	var userName = $(this).data("username");
	var userAvatar = $(this).data("avatar");

	$("input[name=receiverName]").val(userName);
	$("input[name=receiverID]").val(userID);
	$("input[name=sendMessageChatID]").val(chatID);

	userShopping.userChanged({
		id : userID, name : userName
	});

	socket.emit('userIsOnlineCheck', userName);

	$(".userListMessage li.chat-user-" + userID + " a.label").remove();

	if (deviceIsMobile)
	{
		$(".panel-chat .appHeader.chatHeader .pageTitle").html(userName + '<div class="text-muted">YÃ¼kleniyor..</div>');
		$(".panel-chat .chatHeader .left a.icon.goBack").addClass("goChatList");
		$(".appHeader .right").css("display", "none");
	}

	$(".chatMessagePanel .chatPanelHeader").html('' + '<a href="index.php?go=Profile&Id=' + userID + '&Seo=' + userName + '"><img src="' + userAvatar + '"></a>\n' + '<a href="index.php?go=Profile&Id=' + userID + '&Seo=' + userName + '"><b>' + userName + '</b></a>\n' + '<a class="ui mini label">YÃ¼kleniyor..</a>\n' + '<img src="https://cdn.itemsatis.com/global/icons/arrow-back-outline-black.svg" width="20" class="backButtonChat"/>');

	/*
	 $(".chatMessagePanel .chatPanelHeader").append('<button class="btn btn-chat-sms alfa-sms" data-id="" data-name="' + myDatas.userName + '" data-tooltip="2â‚º karÅŸÄ±lÄ±ÄŸÄ±nda kullanÄ±cÄ±ya SMS gÃ¶nder" data-position="top center">\n' +
	 '<i class="fas fa-mobile-alt"></i>\n' +
	 '</button>');
	 */

	/*
	 $(".chatMessagePanel .chatPanelHeader img").attr("src",userAvatar);
	 $(".chatMessagePanel .chatPanelHeader b").text(userName);
	 $(".chatMessagePanel .chatPanelHeader a.label").removeClass("green");
	 $(".chatMessagePanel .chatPanelHeader a.label").removeClass("red");
	 $(".chatMessagePanel .chatPanelHeader a.label").text("YÃ¼kleniyor...");
	 */
	$(".chatMessagePanel").css("display", "block");
	if ($(".chatMobileDropdown").length)
	{
		$(".chatMobileDropdown").addClass("visible");
	}

	$("#ChatMessage").focus();

	var letSeen = false;
	if ($(this).hasClass("notSeenClass") === true)
	{
		letSeen = true;
		$(this).removeClass("notSeenClass");

		var toUserName = $("input[name=receiverName]").val();
		socket.emit('seenMessages', chatID, toUserName);
	}

	checkChatSMSVisible(userID, toUserName);
	getMessageDetails(chatID, letSeen);
	checkBarMessageCount();
});

$(document).on("click", ".rightMessages .chatMessagePanel .chatPanelHeader img", function ()
{
	$(".chatMessagePanel").css("display", "none");
	$(".newMessageBtn").css("display", "block");
});

function checkBarMessageCount()
{
	var CountMessage = $(".notSeenClass").length;

	$(".MessageBtnTopBar a .animateMessage").remove();
	if (CountMessage > 0)
	{
		if ($(".rightMessages span.messageCount").length)
		{
			$(".rightMessages span.messageCount").html(CountMessage);
			if ($(".rightMessages span.messageCount").hasClass("active"))
			{

			}
			else
			{
				$(".rightMessages span.messageCount").addClass("active");
			}
		}


		$(".MessageBtnTopBar a").append('<div class="floating ui red label animateMessage">' + CountMessage + '</div>');
	}
}

function play(url)
{
	return new Promise(function (resolve, reject)
	{   // return a promise
		var audio = new Audio();                     // create audio wo/ src
		audio.preload = "auto";                      // intend to play through
		audio.autoplay = true;                       // autoplay when loaded
		audio.onerror = reject;                      // on error, reject
		audio.onended = resolve;                     // when done, resolve

		audio.src = url; // just for example
	});
}

$(document).on("click", ".showOlderMessage", function ()
{
	showOlderMessage();
});

function showOlderMessage()
{
	pageLoading();
	var chatID = $("input[name=sendMessageChatID]").val();
	socket.emit('getMessageOlders', chatID, olderMessage);
}

$(".notShowingChat").on("click", function ()
{
	$(".rightMessages button.btnOpenMessageList").trigger("click");
});

let whenScrollingPageComingMessageCount = 0;

const checkScroll = (objDiv, receive = false, required = false) =>
{
	setTimeout(() =>
	{
		if (!!required)
		{
			$('#chat-scroll-down').attr("style", "display: none;").html('');
			objDiv.scrollTop = objDiv.scrollHeight;
			receive === true ? whenScrollingPageComingMessageCount = 0 : null;
			return null;
		}
		if (+objDiv.scrollTop >= 500)
		{
			$('#chat-scroll-down').attr("style", "display: none;").html('');
			objDiv.scrollTop = objDiv.scrollHeight;
			receive === true ? whenScrollingPageComingMessageCount = 0 : null;
		}
		else
		{
			receive === true ? whenScrollingPageComingMessageCount += 1 : null;
			$("#chat-scroll-down").attr('style', 'display: block;')
			                      .html(`<i class="fa fa-angle-double-down" aria-hidden="true"></i> ${ whenScrollingPageComingMessageCount > 0 ? '<small id="chat-scroll-badge" class="badge badge-primary">' + whenScrollingPageComingMessageCount + '</small>' : '' }`);
		}
	}, 1);
};

$(document).ready(function ()
{
	$(document).on("click", ".btn.btn-shopping", function ()
	{
		if ($(this).hasClass("active"))
		{
			userShopping.onShopClose();
		}
		else
		{
			userShopping.onShopOpen();
		}
	});

	if ($(".btnOpenMessageList").length)
	{
		$(".btnOpenMessageList").fadeIn();
	}

	$(document).on("click", ".btn-full-message", function ()
	{
		/*
		 socket.emit('getMessageListFull');
		 $(".rightMessages .userListMessage").html('<li class="LoadingChat"><center><br><img src="https://cdn.itemsatis.com/global/loading.gif"><br><br><div>Sohbetler yÃ¼kleniyor..</div><br></center></li>');
		 */

		var nextPage = $(this).data("page");
		socket.emit("getMessageWithPagination", { page : nextPage, limit : 20 });
		$(this).remove();
	});

	var myDatas_String = JSON.stringify(myDatasEnc);
	// socket = io("chat.itemsatis.com", {
	// 	transports: ["websocket"],
	// 	query : {userData : myDatas_String}
	// });

	const makeSocket = () =>
	{
		return io("chat.itemsatis.com", {
			// transports: ["websocket","polling"],
			query : { userData : myDatas_String }
		});
	};

	socket = makeSocket();
	socket.on("disconnect", function ()
	{
		console.log("reconnecting...");
		//socket.connect();
	});
	socket.on("connect_error", function ()
	{
		console.log("connect_error");
		//socket = makeSocket();
	});
	socket.on("connect_timeout", function ()
	{
		console.log("connect_timeout");
		//socket = makeSocket();
	});
	socket.on("error", function (msg)
	{
		console.log("error", msg);
	});


	// socket.emit('userRegister', myDatas_String); /// will tell server that this user came online

	socket.on("listCommandResult.v1", data =>
	{
		if (!data.success)
		{
			return;
		}
		shortcutlist = data.data;
		renderAutoComplete(data.data);
	});

	socket.on("userSeenYourMessage", function (userName)
	{
		$(".userListMessage li[data-username=" + userName + "]").addClass("receiverSeen");
	});

	socket.on('receiveMessage', function (Message, fromUser, Avatar, UserId, ChatID)
	{
		var dt = new Date();
		var time = (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) + ":" + (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes());

		$(".rightMessages .userListMessage .chat-user-" + UserId).remove();

		var seenClassDiv = "";
		if ($(".rightMessages").hasClass("open") == true && $(".chatPanelHeader b").text() == fromUser)
		{
			seenClassDiv = "";
		}
		else
		{
			seenClassDiv = "notSeenClass";
		}

		$(".rightMessages .userListMessage").prepend('<li class="chat-user-' + UserId + ' ' + seenClassDiv + '" data-username="' + fromUser + '" data-avatar="https://cdn.itemsatis.com/avatar/' + Avatar + '" data-chat-id="' + ChatID + '" data-id="' + UserId + '">\n' + '<img data-tooltip="' + fromUser + '" data-position="left center" src="https://cdn.itemsatis.com/avatar/' + Avatar + '">\n' + '<span class="receiver-class"><i class="fa fa-check"></i></span>' + '<span class="chat-username">' + fromUser + '</span>\n' + '<span class="chat-message">' + strip_html_tags(Message) + '</span>\n' + '<span class="chat-message-time">' + time + '</span>\n' + '</li>');

		if ($(".rightMessages").hasClass("open") == true && $(".chatPanelHeader b").text() == fromUser)
		{
			var NewMessage = linkify(Message);
			NewMessage = replaceEmoji(NewMessage);
			NewMessage = stripTags(NewMessage);
			$("#chatMessageList").append('<li class="left-message"><time>' + time + '</time><span>' + NewMessage + '</span></li>');

			if (isValidImageURL(Message))
			{
				$("#chatMessageList").append('<li class="left-message imageMessage"><a href="' + Message + '" target="_new"><img src="' + Message + '"/></a></li>');
			}

			checkScroll(document.getElementById("chatMessageList"), true);
			var UserID = myDatas.userID;
			var activeChatId = $("input[name=sendMessageChatID]").val();
			var activeUserName = $("input[name=receiverName]").val();

			if (ChatID == activeChatId && fromUser == activeUserName && document.visibilityState === 'visible')
			{
				socket.emit('seenMessages', ChatID, activeUserName);
			}
		}
		else
		{
			play("https://cdn.itemsatis.com/global/audio/stairs.mp3").then(function ()
			{
			});

			NewMessage = replaceEmoji(Message);
			Push.create(fromUser, {
				body : strip_html_tags(NewMessage), icon : "https://cdn.itemsatis.com/avatar/" + Avatar, timeout : 4000, onClick : function ()
				{
					window.focus();
					$('.chat-user-' + UserId).trigger("click");
					this.close();
				}
			});
		}

		// reloadLocalStorage();
		checkBarMessageCount();
	});
	socket.on("typingToYou", function (chatID)
	{
		var chatIDPanel = $("input[name=sendMessageChatID]").val();
		if (chatID == chatIDPanel)
		{
			if (user_typing == false)
			{
				$(".userTyping").remove();
				$("#chatMessageList").append('<li class="left-message userTyping"><span>YazÄ±yor..</span></li>');
				user_typing = true;
				clearTimeout(user_timeout);
				user_timeout = setTimeout(typingTimeoutUser, 3000);

				checkScroll(document.getElementById("chatMessageList"));
			}
		}
	});

	$(".chatMessageList").on('wheel', function ()
	{
		const objDiv = document.getElementById("chatMessageList");
		if (+objDiv.scrollTop >= 500)
		{
			$('#chat-scroll-down').attr("style", "display: none;").html('');
			whenScrollingPageComingMessageCount = 0;
		}
	});
	// responsive
	$(document).on('touchmove', function ()
	{
		$(".chatMessageList").trigger('wheel');
	});

	$("#chat-scroll-down").on("click", function (e)
	{
		const objDiv = document.getElementById("chatMessageList");
		objDiv.scrollTop = objDiv.scrollHeight;
		$('#chat-scroll-down').attr("style", "display: none;").html('');
		whenScrollingPageComingMessageCount = 0;
	});

	socket.on('IamBanned', function ()
	{
		location.href = "https://www.itemsatis.com";
	});

	socket.on('user_banned', function ()
	{
		location.href = "https://www.itemsatis.com";
	});

	socket.on('sendMessageSuccess', function (Message, toUser, chatID, fromUser, avatarUser)
	{
		var dt = new Date();
		//var time = dt.getHours() + ":" + dt.getMinutes();
		var time = (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) + ":" + (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes());
		Message = replaceEmoji(Message);

		var Avatar = $(".rightMessages .userListMessage .chat-user-" + toUser).data("avatar");
		$(".rightMessages .userListMessage .chat-user-" + toUser).remove();
		$(".rightMessages .userListMessage").prepend('<li class="chat-user-' + toUser + '" data-username="' + fromUser + '" data-avatar="' + Avatar + '" data-chat-id="' + chatID + '" data-id="' + toUser + '">\n' + '<img data-tooltip="' + fromUser + '" data-position="left center" src="' + avatarUser + '">\n' + '<span class="receiver-class"><i class="fa fa-check"></i></span>' + '<span class="chat-username">' + fromUser + '</span>\n' + '<span class="chat-message">' + strip_html_tags(Message) + '</span>\n' + '<span class="chat-message-time">' + time + '</span>\n' + '</li>');

		var activeChat = $("input[name=sendMessageChatID]").val();
		if (activeChat == chatID)
		{
			var NewMessage = linkify(Message);
			NewMessage = stripTags(NewMessage);
			$("#chatMessageList").append('<li class="right-message"><time>' + time + '</time><span>' + NewMessage + '</span></li>');

			if (isValidImageURL(Message))
			{
				$("#chatMessageList").append('<li class="right-message imageMessage"><a href="' + Message + '" target="_new"><img src="' + Message + '"/></a></li>');
			}

			checkScroll(document.getElementById("chatMessageList"), false, true);
		}

		reloadLocalStorage();

	});

	socket.on('receiveMessageDetails', function (Veriler)
	{
		renderAutoComplete(shortcutlist);
		olderMessageID = 0;
		var LastDate = "";
		var FirstMessageText = "";
		var messageDatas = Veriler;
		var htmlData = "<ul id='chatMessageList'>";

		if (messageDatas.length == 20)
		{
			htmlData = htmlData + '<center><button class="showOlderMessage">Ã–nceki mesajlarÄ± gÃ¶ster</button></center>';
		}

		messageDatas.reverse();
		$.each(messageDatas, function (key, value)
		{
			tempChatId = value.chatID;
			var NewMessage = linkify(value.Message);
			NewMessage = replaceEmoji(NewMessage);

			if (key == 0)
			{
				olderMessageID = value.Id;
				olderMessage = value.Datetime;
				FirstMessageText = " id='Message_" + value.Id + "' ";
			}
			else
			{
				FirstMessageText = "";
			}

			var d = new Date(value.Datetime);

			const chatMonth = d.getMonth();
			const chatDay = d.getDate();
			const chatYear = d.getUTCFullYear();

			//var chatDatetime = d.getHours() + ":" + d.getMinutes();
			var chatDatetime = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());

			const chatFullTime = `${ chatDay } ${ aylarArray[chatMonth] } ${ chatYear } - ${ chatDatetime }`;



			if (!!value.System)
			{
				// eÄŸer mesaj #Sistem# ile baÅŸlÄ±yorsa

				if(value.Message.startsWith('#Sistem#'))
				{
					value.Message = value.Message.replace('#Sistem#', '');
					htmlData = htmlData + '<li id="' + value._id + '" ' + FirstMessageText + ' class="left-message"><time>' + chatDatetime + '</time><span>' + value.Message + '</span></li>';
				}
				else if (value.senderID != myDatas.userID)
				{
					htmlData = htmlData + '<li id="' + value._id + '" class="message-by-system"><time>' + chatDatetime + '</time> <span>' + value.Message + '</li>';
				}

			}
			else
			{
				value.Message = stripTags(value.Message);
				if (LastDate != d.getDate() + " " + aylarArray[d.getMonth()] + " " + d.getFullYear())
				{
					LastDate = d.getDate() + " " + aylarArray[d.getMonth()] + " " + d.getFullYear();
					htmlData = htmlData + '<li class="center-message-date">' + LastDate + '</li>';
				}

				if (myDatas.userID == value.senderID)
				{
					htmlData = htmlData + '<li id="' + value._id + '" ' + FirstMessageText + ' class="right-message ' + (value.isDeleted ? 'isDeletedMessage' : '') + '"><time>' + chatDatetime + '</time><span>' + NewMessage + '</span></li>';
					if (isValidImageURL(value.Message))
					{
						htmlData = htmlData + '<li class="right-message imageMessage"><a href="' + value.Message + '" target="_new"><img src="' + value.Message + '"/></a></li>';
					}
				}
				else
				{
					htmlData = htmlData + '<li id="' + value._id + '" ' + FirstMessageText + ' class="left-message ' + (value.isDeleted ? 'isDeletedMessage' : '') + '"><time>' + chatDatetime + '</time><span>' + NewMessage + '</span></li>';
					if (isValidImageURL(value.Message))
					{
						htmlData = htmlData + '<li class="left-message imageMessage"><a href="' + value.Message + '" target="_new"><img src="' + value.Message + '"/></a></li>';
					}
				}
			}

		});
		htmlData = htmlData + "</ul>";

		$(".rightMessages .chatMessagePanel .chatMessageList").html(htmlData);

		$(".chatMessageList").removeClass("Loading");

		setTimeout(function ()
		{
			const objDiv = document.getElementById("chatMessageList");
			if (!!objDiv.scrollHeight)
			{
				objDiv.scrollTop = objDiv.scrollHeight;
			}
		}, 1);

	});

	socket.on('receiveMessageOlders', function (Veriler)
	{
		pageLoaded();
		var scroolToDiv = olderMessageID;

		var LastDate = "";
		var htmlData = "";
		var messageDatas = Veriler;

		$(".rightMessages .chatMessagePanel .chatMessageList ul#chatMessageList center").remove();
		if (messageDatas.length == 20)
		{
			htmlData = htmlData + '<center><button class="showOlderMessage">Ã–nceki mesajlarÄ± gÃ¶ster</button></center>';
		}

		messageDatas.reverse();
		$.each(messageDatas, function (key, value)
		{
			tempChatId = value.chatID;
			var NewMessage = linkify(value.Message);
			NewMessage = replaceEmoji(NewMessage);

			if (key === 0)
			{
				olderMessageID = value._id;
				scroolToDiv = value._id;
				olderMessage = value.Datetime;
			}

			var d = new Date(value.Datetime);
			//var chatDatetime = d.getHours() + ":" + d.getMinutes();
			var chatDatetime = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());

			if (!!value.System)
			{

				if (value.senderID != myDatas.userID)
				{
					htmlData = htmlData + '<li id="' + value._id + '" class="message-by-system"><time>' + chatDatetime + '</time> <span class="message-text">' + value.Message + '</li>';
				}

			}
			else
			{
				if (LastDate != d.getDate() + " " + aylarArray[d.getMonth()] + " " + d.getFullYear())
				{
					LastDate = d.getDate() + " " + aylarArray[d.getMonth()] + " " + d.getFullYear();
					htmlData = htmlData + '<li class="center-message-date">' + LastDate + '</li>';
				}

				if (myDatas.userID == value.senderID)
				{
					htmlData = htmlData + '<li id="' + value._id + '" data-datetime="' + value.Datetime + '" class="right-message ' + (value.isDeleted ? 'isDeletedMessage' : '') + '"><time>' + chatDatetime + '</time><span>' + NewMessage + '</span></li>';
					if (isValidImageURL(value.Message))
					{
						htmlData = htmlData + '<li class="right-message imageMessage"><a href="' + value.Message + '" target="_new"><img src="' + value.Message + '"/></a></li>';
					}
				}
				else
				{
					htmlData = htmlData + '<li id="' + value._id + '" data-datetime="' + value.Datetime + '" class="left-message ' + (value.isDeleted ? 'isDeletedMessage' : '') + '"><time>' + chatDatetime + '</time><span>' + NewMessage + '</span></li>';
					if (isValidImageURL(value.Message))
					{
						htmlData = htmlData + '<li class="left-message imageMessage"><a href="' + value.Message + '" target="_new"><img src="' + value.Message + '"/></a></li>';
					}
				}
			}

		});

		$(".rightMessages .chatMessagePanel .chatMessageList ul#chatMessageList").prepend(htmlData);


		//$(".rightMessages .chatMessagePanel .chatMessageList ul#chatMessageList").scrollTop($("#" + scroolToDiv).offset().top - ($(".rightMessages.open").offset() + 150));

	});

	socket.on("receiveMessageWithPagination", function (Data)
	{
		var totalnoSeen = 0;
		$(".LoadingChat").remove();
		$(".chatPanel").css("display", "none");
		var chatCount = 0;
		var firstMessageId = 0;

		$.each(Data.chats, function (key, value)
		{

			if (myDatas.userID == value.senderID)
			{
				var otherUserID = value.receiverID;
				var Avatar = value.receiverAvatar;
				var MessageName = value.receiverName;
			}
			else
			{
				var otherUserID = value.senderID;
				var Avatar = value.senderAvatar;
				var MessageName = value.senderName;
				if (value.receiverSeen == false)
				{
					totalnoSeen++;
				}
			}

			if ($(".rightMessages .userListMessage .chat-user-" + otherUserID).length)
			{
				return;
			}

			if (chatCount == 0)
			{
				firstMessageId = otherUserID;
			}

			var seenClass = "";
			if (myDatas.userID != value.senderID && value.receiverSeen == false)
			{
				seenClass = "notSeenClass";
			}
			else if (myDatas.userID == value.senderID && value.receiverSeen == true)
			{
				seenClass = "receiverSeen";
			}

			value.Message = replaceEmoji(value.Message);

			var d = new Date(value.Datetime);
			//var chatDatetime = d.getHours() + ":" + d.getMinutes();
			var chatDatetime = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());

			$(".rightMessages .userListMessage").append('<li data-inverted="" class="chat-user-' + otherUserID + ' ' + seenClass + '" data-username="' + MessageName + '" data-avatar="https://cdn.itemsatis.com/avatar/' + Avatar + '" data-chat-id="' + value.chatID + '" data-id="' + otherUserID + '">\n' + '<img src="https://cdn.itemsatis.com/avatar/' + Avatar + '">\n' + '<span class="receiver-class"><i class="fa fa-check"></i></span>' + '<span class="chat-username">' + MessageName + '</span>\n' + '<span class="chat-message">' + strip_html_tags(value.Message) + '</span>\n' + '<span class="chat-message-time">' + chatDatetime + '</span>\n' + '</li>');
			chatCount++;
		});

		if (Data.count == 20)
		{
			$(".rightMessages .userListMessage").append('<button class="btn btn-full-message" data-page="' + (Data.page + 1) + '"><i class="fas fa-plus"></i><span class="hidden-mobile"> Daha fazla gÃ¶ster</span></button>');
		}

		$('.rightMessages .userListMessage li').popup();

	});

	socket.on('receiveMessageList', function (Data)
	{
		var totalnoSeen = 0;
		$(".LoadingChat").remove();
		$(".chatPanel").css("display", "none");
		var chatCount = 0;
		var firstMessageId = 0;

		// var messageDatas = JSON.parse(Data);
		$(".rightMessages .userListMessage").html(" ");
		$.each(Data, function (key, value)
		{
			if (myDatas.userID == value.senderID)
			{
				var otherUserID = value.receiverID;
				var Avatar = value.receiverAvatar;
				var MessageName = value.receiverName;
			}
			else
			{
				var otherUserID = value.senderID;
				var Avatar = value.senderAvatar;
				var MessageName = value.senderName;
				if (value.receiverSeen == false)
				{
					totalnoSeen++;
				}
			}

			if ($(".rightMessages .userListMessage .chat-user-" + otherUserID).length)
			{
				return;
			}

			if (chatCount == 0)
			{
				firstMessageId = otherUserID;
			}

			var seenClass = "";
			if (myDatas.userID != value.senderID && value.receiverSeen == false)
			{
				seenClass = "notSeenClass";
			}
			else if (myDatas.userID == value.senderID && value.receiverSeen == true)
			{
				seenClass = "receiverSeen";
			}

			value.Message = replaceEmoji(value.Message);

			var d = new Date(value.Datetime);
			//var chatDatetime = d.getHours() + ":" + d.getMinutes();
			var chatDatetime = (d.getHours() < 10 ? "0" + d.getHours() : d.getHours()) + ":" + (d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());

			$(".rightMessages .userListMessage").append('<li data-inverted="" class="chat-user-' + otherUserID + ' ' + seenClass + '" data-username="' + MessageName + '" data-avatar="https://cdn.itemsatis.com/avatar/' + Avatar + '" data-chat-id="' + value.chatID + '" data-id="' + otherUserID + '">\n' + '<img src="https://cdn.itemsatis.com/avatar/' + Avatar + '">\n' + '<span class="receiver-class"><i class="fa fa-check"></i></span>' + '<span class="chat-username">' + MessageName + '</span>\n' + '<span class="chat-message">' + strip_html_tags(value.Message) + '</span>\n' + '<span class="chat-message-time">' + chatDatetime + '</span>\n' + '</li>');
			chatCount++;
		});

		if (Data.length == 21)
		{
			$(".rightMessages .userListMessage").append('<button class="btn btn-full-message" data-page="2"><i class="fas fa-plus"></i><span class="hidden-mobile"> Daha fazla gÃ¶ster</span></button>');
		}

		$('.rightMessages .userListMessage li').popup();


		if (chatCount == 0 && typeof fullChat == "undefined")
		{
			$(".notShowingChat").fadeIn();
		}

		if (typeof fullChat != "undefined" && fullChat == true)
		{

			/*
			 if(activeUser == false)
			 {
			 $(".rightMessages .userListMessage li[data-id="+firstMessageId+"]").trigger("click");
			 }
			 else
			 {
			 $(".rightMessages .userListMessage li[title="+activeUser+"]").trigger("click");
			 }

			 */

		}

		if (typeof activeUser != "undefined" && activeUser != false)
		{
			messageStartParameter(activeUser);
		}

		// reloadLocalStorage();
		checkBarMessageCount();
	});

	socket.on('iAmConnected', function (Data)
	{
		var pageName = getUrlParameter('go');
		var chatUserName = getUrlParameter('User');

		socket.emit('listCommand.v1');
		socket.emit('getMessageList');
	});

	socket.on('SocketError', function (Data)
	{
		if (typeof Data === "string" && Data.startsWith("Yeni bir mesaj gÃ¶nderebilmek iÃ§in") && tempMsg != "")
		{
			$("#ChatMessage").val(tempMsg);
		}
		Swal.fire({
			type : "error", showCloseButton : true, title : "Sistem HatasÄ±!", confirmButtonText : "Tamam", html : Data
		});
	});

	socket.on("MsgValidationError", ({ message, word }) =>
	{
		$('#buttonSendMessage').attr('disabled', 'disabled');
		$('#ChatMessage').addClass('is-invalid');
		$('#ChatMessage').val(message);
		if (!+$('#chatSendMessageBox').has('#isInvalidMessage').length)
		{
			$('#chatSendMessageBox').append(`<small className="isInvalidMessage" id="isInvalidMessage">MesajÄ±nÄ±zÄ±n <i>'${ word }'</i> kelimesini iÃ§ermemelidir.</small>`);
		}
		else
		{
			$('#chatSendMessageBox #isInvalidMessage').html(`MesajÄ±nÄ±zÄ±n <i>'${ word }'</i> kelimesini iÃ§ermemelidir.`);
		}
	});

	socket.on('SocketRefreshError', (data) =>
	{
		Swal.fire({
			type : "error", showCloseButton : true, title : "Sistem HatasÄ±!", confirmButtonText : "Tekrar Dene", html : data
		}).then(() =>
		{
			socket.emit('userRegister', myDatas_String);
		});
	});

	socket.on('phoneVerifyNeeded', function (Data)
	{
		if (deviceIsMobile)
		{
			myApp.dialog.alert('Telefon numaranÄ±z doÄŸrulanmadan sohbet edemezsiniz.');
		}
		else
		{
			/*
			 Swal.fire({
			 type: "telefon",
			 allowOutsideClick: false,
			 allowEscapeKey: false,
			 showCloseButton: true,
			 confirmButtonText: "Telefon NumaramÄ± DoÄŸrula",
			 html: "<br>" +
			 "<img width='130' src='https://cdn.itemsatis.com/uploads/admin/927261.svg'/><br><br>" +
			 "<h3 class='text-white'>Telefon DoÄŸrulama</h3>" +
			 "Sohbet baÅŸlatabilmek iÃ§in telefon numaranÄ±zÄ± doÄŸrulamanÄ±z gerekmektedir.<br>AÅŸaÄŸÄ±daki butona tÄ±klayarak telefon numaranÄ±zÄ± doÄŸrulayabilirsiniz."
			 }).then((result) => {
			 if (result.value)
			 window.location.assign("/telefon-dogrula.html")
			 });

			 */
		}
	});

	socket.on("UserIsOnlineStatus", function (Data)
	{
		$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").removeClass("system-label");
		if ($("input[name=receiverID]").val() == "1")
		{
			$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").addClass("system-label");
			$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text("Sistem ÃœyeliÄŸi");
			return;
		}

		if (deviceIsMobile)
		{
			if (Data == "Offline")
			{
				$(".appHeader.chatHeader .pageTitle .text-muted").text("Ã‡evrimdÄ±ÅŸÄ±");
			}
			else
			{
				var Suan = Math.round(+new Date() / 1000);
				var KalanSaniye = (Suan - Data);
				if (KalanSaniye < 180)
				{
					$(".appHeader.chatHeader .pageTitle .text-muted").text("Ã‡evrimiÃ§i");
				}
				else
				{
					var KalanDakika = Math.floor(KalanSaniye / 60);
					if (KalanDakika < 60)
					{
						$(".appHeader.chatHeader .pageTitle .text-muted").text(KalanDakika + " dk. Ã¶nce aktifti");
					}
					else
					{
						var KalanSaat = Math.floor(KalanDakika / 60);
						if (KalanSaat < 23)
						{
							$(".appHeader.chatHeader .pageTitle .text-muted").text(KalanSaat + " saat Ã¶nce aktifti");
						}
						else
						{
							$(".appHeader.chatHeader .pageTitle .text-muted").text("Ã‡evrimdÄ±ÅŸÄ±");
						}
					}
				}

			}
		}
		if (Data == "Offline")
		{
			if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("green") == true)
			{
				$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").removeClass("green");
			}

			if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("red") == false)
			{
				$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").addClass("red");
			}

			$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text("Ã‡evrimdÄ±ÅŸÄ±");
		}
		else
		{
			var Suan = Math.round(+new Date() / 1000);
			//var KalanSaniye = Suan - Data;
			var KalanSaniye = (Suan - Data);

			if (KalanSaniye < 180)
			{
				if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("red") == true)
				{
					$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").removeClass("red");
				}

				if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("green") == false)
				{
					$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").addClass("green");
				}


				$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text("Ã‡evrimiÃ§i");
			}
			else
			{
				if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("green") == true)
				{
					$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").removeClass("green");
				}

				if ($(".rightMessages .chatMessagePanel .chatPanelHeader a.label").hasClass("red") == false)
				{
					$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").addClass("red");
				}

				var KalanDakika = Math.floor(KalanSaniye / 60);
				if (KalanDakika < 60)
				{
					$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text(KalanDakika + " dk. Ã¶nce aktifti");
				}
				else
				{
					var KalanSaat = Math.floor(KalanDakika / 60);
					if (KalanSaat < 7)
					{
						$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text(KalanSaat + " saat Ã¶nce aktifti");
					}
					else
					{
						$(".rightMessages .chatMessagePanel .chatPanelHeader a.label").text("Ã‡evrimdÄ±ÅŸÄ±");
					}
				}
			}
		}
	});

	setInterval(function ()
	{
		var ChatUserName = $("input[name=receiverName]").val();
		var ChatUserId = $("input[name=receiverID]").val();
		if (ChatUserId != "0" && ChatUserName != "0")
		{
			socket.emit('userIsOnlineCheck', ChatUserName);
		}
	}, 10000);
});

