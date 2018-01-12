---
typora-copy-images-to: ./assets
typora-root-url: .
---

![badge](https://img.shields.io/badge/mendix-6.10.5-green.svg) ![badge](https://img.shields.io/badge/mendix-7.6.0-green.svg) ![badge](https://img.shields.io/badge/mendix-7.8.0-green.svg) ![badge](https://img.shields.io/badge/mobile-friendly-green.svg) ![badge](https://img.shields.io/badge/offline-capable-green.svg)

# Adobe Analytics

This widget allows you to trigger Adobe Analytics events from your Mendix mobile application


### Installation

1. Download the widget from the app store, and include it on any page/s where you'd like to trigger an Adobe Analytics event. Keep in mind that there are two types of event triggers: on-load and on-click, so where you put the widget in your model may make a difference.

   > E.g. Say you have a news application with a homepage with links to multiple articles, and each of these links opens an article detail page. You could choose to put the widget on the homepage, but then you'd have to setup on-click triggers for each different article link. In this case, it'd make more sense to put the widget on the article page with an on-load trigger to fire an event that someone viewed this article. In general, use on-load triggers for content (what are they viewing?) and on-click tirggers for actions (what are they doing?)

2. In the **/www** directory of your phonegap package, include the **ADBMobileConfig.json** file that you can download from your [Adobe Mobile Services](https://mobilemarketing.adobe.com/) portal.

3. Configure the widget

   > Each instance of the widget has a **Data Set** and an **Events** list. The Data Set defines key-value pairs that you can use to insert dynamic data into your event payload. The Events list is where you specify the trigger for the event, and a template for the event payload.

   ![294496BD-6586-4342-9FC5-69EF7E2F54DE](/assets/294496BD-6586-4342-9FC5-69EF7E2F54DE.png)

####Data Set (Keys)

**General**


   ![861C87DB-2682-4CE6-9F8E-31604059F792](/assets/861C87DB-2682-4CE6-9F8E-31604059F792.png)

   - `Data Source` : Unless you know what you're doing, keep this as **Context**
   - `Name` : the name that you will use to reference this Data Set value in your Event Payload Template

   **Context (Default)**

   ![89CB42AD-BF21-43FA-BA71-B4D5F511D9B6](/assets/89CB42AD-BF21-43FA-BA71-B4D5F511D9B6.png)

   - `value` : the attribute from the context object whose value will replace the `name` in your Event Payload Template

   **Account** _Advanced_
   *If you choose* **Account** *as your* `Data Source` *then you must configure this page*

   ![584A5BE0-72CA-41A4-85DA-B2FFF4C0CD57](/assets/584A5BE0-72CA-41A4-85DA-B2FFF4C0CD57.png)

   - `Account Entity` : The entity which represents your user. The user should only be able to access one object of this entity.
   - `Association Name` : The Association over which to look to get data
   - `Target Entity` : The entity at the other end of `Association Name` from `Account Entity`. (This entity should have the data that we actually want)
   - `Target Attribute` : the attribute from `Target Entity` whose value will replace the `name` in your Event Payload Template


#### Events

**Event**

![00ED0C8C-D3F5-4B0A-88E8-7416368072B5](/assets/00ED0C8C-D3F5-4B0A-88E8-7416368072B5.png)

- `Type` :

  - **Page Load** - the event is fired when the widget loads
  - **Global Click** - attaches an on-click listener to some element on the page
  - **Sibling Click** - attaches an on-click listener to a sibling element of the widget. Use this for when you want an event on a button for each item in a listview

- `Target` : The Mendix name of the element to trigger the event

- `Event Name` : The name of the event to send to Adobe. 

  > Note: in this field, and any fields on the **Payload** tab, you can inject data into the template by using `{` + Data Set `name` + `}`, i.e. `{name}` will become the value of `TestSuite.Color.Name` on the context object.

**Payload**

![53C849BF-ED37-447F-863D-813EFC65C57D](/assets/53C849BF-ED37-447F-863D-813EFC65C57D.png)

These are all fields that you can configure to send as metadata with the Adobe Analytics event.




### **Typical** usage scenario

- To send tracking information to Adobe Analytics

### Known Limitations

- The Dataset can only support data from entities that have a 1-* with Account, or in the context object

###### Based on the Mendix Widget Boilerplate

See [AppStoreWidgetBoilerplate](https://github.com/mendix/AppStoreWidgetBoilerplate/) for an example
