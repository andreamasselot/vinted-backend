require("dotenv").config();
const express = require("express");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");
const isAuthenticated = require("../middlewares/isAuthenticated");

const fileUpload = require("express-fileupload");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const name = req.body.title;
      const price = req.body.price;
      const description = req.body.description;
      const details = [
        {
          MARQUE: req.body.brand,
        },
        {
          TAILLE: req.body.size,
        },
        { ETAT: req.body.condition },

        { COULEUR: req.body.color },

        {
          EMPLACEMENT: req.body.city,
        },
      ];
      const imageToUpload = req.files.picture;
      const result = await cloudinary.uploader.upload(
        convertToBase64(imageToUpload)
      );

      const newOffer = new Offer({
        product_name: name,
        product_description: description,
        product_price: price,
        product_details: details,
        product_image: result,
        owner: req.user,
      });
      if (!name || !price || !description) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      await newOffer.save();
      res.status(200).json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  //route authentifiée
  //récupérer l'ensemble des annonces, .find()
  // Récupérer le nombre total d'annonces .count()
  // Définir les filtres
  //appliquer les filtres à la recherche d'annonces
  // définir combien de résultat afficher par pages (20)
  try {
    const { title, priceMin, priceMax, sort, page } = req.query; // récupère les données passées en query
    //filtres
    const regExp = new RegExp(title, "i"); //définir la recherche a partir du titre. regExp
    const priceFilter = {
      $gte: 0, //si pas 0 !! objet vide (si pas de filtre récupèrera tout ce qui est de 0 ou plus)
    };
    if (priceMin) {
      priceFilter.$gte = priceMin; //gte = plus grand que ou egal ----- lte = plus petit que ou egal ---- 1 = croissant, -1 = décroissant
    }
    if (priceMax) {
      priceFilter.$lte = priceMax;
    } // le filtre ne doit pas s'appliquer si on ne le selectionne pas ( => condition if pricemin existe ou pas)
    const sortFilter = {};
    if (sort === "price-desc") {
      //ajouter le product_price a l'objet sortFilter
      sortFilter.product_price = -1; //product_price trouvé car défini dans newOffer puis saved
    } else if (sort === "price-asc") {
      //définir le filtre de prix pour que les query correspondent avec "price-desc" et "price-asc"
      sortFilter.product_price = 1;
    }
    const currentPage = page * 20 - 20; // la page en query x le nmbre d'offres que j'ai choisi par pages - le mm nombre pour revenir a la position 0
    //const skip (pageRequired -1 * limit;)
    const count = await Offer.count(); // récupère le nombre d'annonces existantes dans la bdd --> .countDocuments(filters)
    const offers = await Offer.find({
      product_name: regExp,
      product_price: priceFilter,
    })
      .sort(sortFilter)
      .skip(currentPage)
      .limit(20)
      .populate("owner", "account"); // récupère toutes les annonces + applique lles filtres
    res.json({ count: count, offers: offers }); // retourner le "count" + les offres filtrées. tableau objet ou objet
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/offer/delete", isAuthenticated, async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) {
      return res.status(400).json({ error: "Missing ID" });
    }
    const offer = await Offer.findById(req.body.id);
    console.log(offer);
    if (req.user._id.toString() !== offer.owner.toString()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    await offer.delete();
    res.json({ message: "Offer deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    // console.log(req.params); req.params = ^ {id : }
    const id = req.params.id;
    const offer = await Offer.findById(id).populate("owner", "account"); // sans hash + salt +token ==> populate( "owner", "account", "_id") deployer la clef owner + juste la clef account et _id
    if (!offer) {
      // si trouvé
      return res.status(404).json({ error: "Offer does not exist" });
    }
    res.json(offer);
    //récupérer les détails d'une annonce en fonction de son id
    // récupérer l'id des annonce => findById()
    //retourner le résultat
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
