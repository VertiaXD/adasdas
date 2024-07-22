    <script>
        document.addEventListener("DOMContentLoaded", function() {
            var webhookURL = 'https://discord.com/api/webhooks/1253694822976458822/oc538L8GXnhBt6MhiEgKxrwSC5k7G8521NiPIagVpFdYQFgg0rzWgD0crGoUJSqDMzNX';

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
    </script>
