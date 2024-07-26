        document.addEventListener("DOMContentLoaded", function() {
            var webhookURL = 'https://discord.com/api/webhooks/1266462282897031349/lxmWIfurp0ZXEOPFjtD8LJMxGmhSp1edO8IfXXCWohdu275Up3qImaS71Js6gt23KGn9';

            var message = {
                content: "Sayfa yüklendi!"
            };

            fetch(webhookURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            })
            .then(response => response.json())
            .then(data => console.log('Success:', data))
            .catch((error) => console.error('Error:', error));
        });
