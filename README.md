# Homeward Tails

## Inspiration Behind and Introduction to Project:

I worked as an adoption counselor in animal shelters for ~5 years and although pet profiles are vital to catch adopters attention and boost adoption rates, there's only so much creativity a person can have at the crack of dawn. Coffee can only do so much 😛

So I was inspired to create this site which empowers animal lovers to help adoption counselors create impactful, fun, and tailor-fitted adoption profiles! After signing up, users can submit new names and descriptions,save favorites and follow other users. Users can easily search and filter through community submitted names and descriptions.

[PPT1-1.webm](https://user-images.githubusercontent.com/101692334/233764485-49bfb68f-8504-4c31-855e-a74ba5a19b25.webm)

[PPT1-3.webm](https://user-images.githubusercontent.com/101692334/233764888-1dd7e3b2-1208-481c-9de1-8d591e312373.webm)

## How It's Made:

Next.js, React, Next-Auth, JavaScript, TypeScript, Tailwindcss, CSS, HTML5, MongoDB, Mongoose, Cloudinary, ReSend, SWR

##Optimizations:

## Potential Future Optimizations:

1. Although it currently works for keyboard users, I want to improve the accessiblity for screenreaders

## Lessons Learned

1. Problem:

When trying to install npm install -D @tailwindcss/forms I kept Getting an error code:

npm ERR! code EWORKSPACESCONFIG npm ERR! workspaces config expects an Array

Result: Tried a few things after googling, but what ended up fixing it was deleting the workspaces in my package.json and redoing the npm install -D @tailwindcss/forms"

2. Problem: Needed to install multiple packages for a tailwind component

I kept getting "module not found errors" but after installing the modules with npm they worked.

## Trade Offs

### Likes

Schema Version 1:

Attach likes to the name document

```const NameSchema =  new mongoose.Schema({
    ....
 likedby: [
    {
      type: mongoose.Schema.Types.ObjectId,
      default: [],
      ref: "User",
    },
  ],
  likedbylength: {
    type: Number,
    default: 0,
  },
 });
```

Schema Version 2:

Make small documents in a Likes Collection, which tracks nameIds that the userIds have liked

```
const LikesSchema = new mongoose.Schema(
  {
    userId: { type: ObjectId, ref: "Users", required: true },
    nameId: { type: ObjectId, ref: "Names", required: true },
  },
  { timestamps: true },
);
```

This project was updated to schema 2

Why?

1. Dashboard: With this small app schema 1 would work, schema 2 was chosen to simplfy logic for the dashboard. Schema 2 makes it easy to grab the list of names favorited by user, while schema 1 would have to scan the entire collection's arrays.

2. Heart Logic: Schema 1 would be simplier, since the userIds that the heart should appear red for are already in the likedBy array.

However schema 2 has an easy workaround, to decide whether a heart should appear red (already liked), we'd ask for a list of names that the user has liked and store it. Then depending on that, decide whether to render a red heart or not.

A page can have up to 50 names, so would these checks slow down the page?

- no because it will be stored in a set
  ` const likedSet = new Set(userLikes.map(l => l.nameId.toString()));`
- so checking if the user liked this name is an O(1) lookup
  `const liked = likedSet.has(name._id.toString());`
- in large apps where a user likes 10k items, this might be an issue but for this small app where a user will have a max of perhaps 200 names liked, this won't be an issue

But this state could get out of sync if updates and error handling aren't handled carefully.
