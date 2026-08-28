-- Popup max height is now expressed in vh (viewport height %), not px.
-- Convert the old px default to a sensible vh value.
UPDATE "ShopSettings" SET "formMaxHeight" = 90 WHERE "formMaxHeight" = 640;
UPDATE "ShopSettings" SET "formMaxHeight" = 90 WHERE "formMaxHeight" > 100;
