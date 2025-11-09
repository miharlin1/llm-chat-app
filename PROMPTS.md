# PROMPTS.md
This file documents AI prompts used during development, the tool/model used, the context, and the outcome or code changes made. 

## Prompt 1
> **_add a tiny button to the chatbot response messages that are then saved and displayed on the saved.html page_**

Context:
After created the new page, saved.HTML, I wanted a button to be displayed on each assistant message so users could save it to the new page. 

Files modified/created : 
`chat.js`, `saved.html`

## Prompt 2
> **_can you show me where to add the button in chat.js_**

Context:
The previous prompt created a saveMessage function and directed me to add the following:
```js
if (className === 'assistant-message') {
    messageElement.innerHTML = `
        <p>${text}</p>
        <button class="save-button" onclick="saveMessage(this.parentElement)">Save</button>
    `;
} else {
    messageElement.innerHTML = `<p>${text}</p>`;
}
```

Files modified/created : 
`chat.js`

## Prompt 3
> **_when i save a message, can you switch from save-icon to saved-icon_**

Context:
I created an assets folder to hold a save image icon and saved image filled icon. I wanted to use these images instead of the generic save button that my previous prompt had generated.

Files modified/created : 
`chat.js`, `saved.html`

## Prompt 4
> **_Switch the save-icon to the already existing saved-icon.png when clicked. Do not add a background to the icon_**

Context:
I had to specify how I wanted the images to be used because the previous prompt led the AI assistant to create a new saved-icon.svg. In this prompt I specified how to change the image.

Files modified/created : 
`chat.js`

## Prompt 4
> **_When I return to the chat bot page, how can I save the previous conversation? I don't want it to refresh_**

Context:
When I went to view saved messages, the previous chat conversation was then refreshed upon returning. I wanted it to still be visable.

Files modified/created : 
`chat.js`
