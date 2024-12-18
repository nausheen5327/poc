import { alpha, Grid, Modal, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ProductsApi } from '@/hooks/react-query/config/productsApi'
import { useWishListDelete } from '@/hooks/react-query/config/wish-list/useWishListDelete'
import { cart, setCampCart, setCart, setCartList, setClearCart } from '@/redux/slices/cart'
import { addWishList, removeWishListFood } from '@/redux/slices/wishList'
import {
    calculateItemBasePrice,
    getConvertDiscount,
    handleProductValueWithOutDiscount,
    isAvailable,
} from '@/utils/customFunctions'
import { useTheme } from '@mui/material/styles'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import AuthModal from '../auth'
import { FoodDetailModalStyle } from '../home/HomeStyle'
import CartClearModal from './CartClearModal'
import StartPriceView from './StartPriceView'

import AddOnsManager from './AddOnsManager'
import AddOrderToCart from './AddOrderToCart'
import AddUpdateOrderToCart from './AddUpdateOrderToCart'
import { handleProductVariationRequirementsToaster } from './SomeHelperFuctions'
import TotalAmountVisibility from './TotalAmountVisibility'
import UpdateToCartUi from './UpdateToCartUi'
import VariationsManager from './VariationsManager'

import { CustomToaster } from '@/components/custom-toaster/CustomToaster'
import { useIsMount } from '@/components/first-render-useeffect-controller/useIsMount'
import HalalSvg from '@/components/food-card/HalalSvg'
import { useGetFoodDetails } from '@/hooks/react-query/food/useGetFoodDetails'
import { CustomStackFullWidth } from '@/styled-components/CustomStyles.style'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import { Box, Stack } from '@mui/system'
import useAddCartItem from '../../hooks/react-query/add-cart/useAddCartItem'
import useCartItemUpdate from '../../hooks/react-query/add-cart/useCartItemUpdate'
import useDeleteAllCartItem from '../../hooks/react-query/add-cart/useDeleteAllCartItem'
import { onErrorResponse } from '../ErrorResponse'
import { handleValuesFromCartItems } from '../checkout-page/CheckoutPage'
import { getGuestId, getToken } from '../checkout-page/functions/getGuestUserId'
import LocationModalAlert from '../food-card/LocationModalAlert'
import { ReadMore } from '../landingpage/ReadMore'
import {
    getSelectedAddons,
    getSelectedVariations,
} from '../navbar/second-navbar/SecondNavbar'
import FoodModalTopSection from './FoodModalTopSection'
import IncrementDecrementManager from './IncrementDecrementManager'
import VagSvg from './VagSvg'
import { handleInitialTotalPriceVarPriceQuantitySet } from './helper-functions/handleDataOnFirstMount'
import useCancellablePromise from '@/api/cancelRequest'
import { deleteCall, getCall, postCall } from '@/api/MainApi'
import { getCartItems } from '@/api/getCartItem'
import CustomizationSection from './customizationManager'
import RestaurantMDetails from './helper-functions/restaurantMDetails'
import { getValueFromCookie } from '@/utils/cookies'
import { updateCartItem } from '@/utils/checkout/cart/updateCartItem'
const FoodDetailModal = ({
    product,
    image,
    open,
    handleModalClose,
    setOpen,
    currencySymbolDirection,
    currencySymbol,
    digitAfterDecimalPoint,
    handleBadge,
    campaign,
}) => {
    const isMount = useIsMount()
    const router = useRouter()
    const { t } = useTranslation()
    const dispatch = useDispatch()
    const cartItems = useSelector(state=>state.cart.cartList);
    const theme = useTheme()
    const [selectedOptions, setSelectedOptions] = useState([])
    const [isLocation, setIsLocation] = useState(false)
    const [totalPrice, setTotalPrice] = useState(null)
    const [varPrice, setVarPrice] = useState(null)
    const [totalWithoutDiscount, setTotalWithoutDiscount] = useState(null)
    const [modalFor, setModalFor] = useState('sign-in')
    const [add_on, setAddOns] = useState([])
    const [product_add_ons, setProductAddOns] = useState(product?.add_ons)
    const { cartList } = useSelector((state) => state.cart)
    const [quantity, setQuantity] = useState(1)
    const [clearCartModal, setClearCartModal] = React.useState(false)
    const handleClearCartModalOpen = () => setClearCartModal(true)
    const { token } = useSelector((state) => state.userToken)
    const { wishLists } = useSelector((state) => state.wishList)
    const [modalData, setModalData] = useState([product])
    const [variationStock, setVariationStock] = useState(false)
    const [errorCode, setErrorCode] = useState('')
    const [productPayload, setProductPayload] = useState();
    const location = useSelector(state=>state.addressData.location);
    const [productUpdate, setProductUpdate] = useState(false);
    // const { mutate: addToCartMutate, isLoading: addToCartLoading } =
    //     useAddCartItem()
    // const { mutate: updateMutate } = useCartItemUpdate()
    // const { mutate: deleteCartItemMutate } = useDeleteAllCartItem()
    // console.log('product 123456',product)
    // useEffect(()=>{
    //     setModalData([product]);
    // },[])

    const itemSuccess = (res) => {
        if (res) {
            handleInitialTotalPriceVarPriceQuantitySet(
                res,
                setModalData,
                setTotalPrice,
                setVarPrice,
                setQuantity,
                setSelectedOptions,
                setTotalWithoutDiscount
            )
            setAddOns([])
            setSelectedOptions([])
        }
    }

    const { cancellablePromise } = useCancellablePromise();
  const [isItemAvailableInCart, setIsItemAvailableInCart] = useState(false);
  const [itemAvailableInCart, setItemAvailableInCart] = useState(null);
  const [productDetails, setProductDetails] = useState({});

  const [customization_state, setCustomizationState] = useState({});
  const [variationState, setVariationState] = useState([]);

  const [activeImage, setActiveImage] = useState("");
  const [activeSize, setActiveSize] = useState("");

  const [customizationPrices, setCustomizationPrices] = useState(0);
  const [itemOutOfStock, setItemOutOfStock] = useState(false);
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  const [productAvailability, setProductAvailability] = useState(true);

  const deleteCartItem = async (itemId) => {
    const user = JSON.parse(getValueFromCookie("user"));
    const url = `/clientApis/v2/cart/${user.id}/${itemId}`;
    const res = await deleteCall(url);
    getCartItems();
  };
    
      const calculateSubtotal = (groupId, customization_state) => {
        let group = customization_state[groupId];
        if (!group) return;
    
        let prices = group.selected.map((s) => s.price);
        setCustomizationPrices((prevState) => {
          return prevState + prices.reduce((a, b) => a + b, 0);
        });
    
        group?.childs?.map((child) => {
          calculateSubtotal(child, customization_state);
        });
      };
    
      let selectedCustomizationIds = [];
    
      const getCustomization_ = (groupId) => {
        let group = customization_state[groupId];
        if (!group) return;
    
        let customizations = group.selected.map((s) =>
          selectedCustomizationIds.push(s.id)
        );
        group?.childs?.map((child) => {
          getCustomization_(child);
        });
      };
    
      const getCustomizations = () => {
        const { customisation_items } = productPayload;
    
        if (!customisation_items.length) return null;
        const customizations = [];
    
        const firstGroupId = customization_state["firstGroup"]?.id;
    
        if (!firstGroupId) return;
        selectedCustomizationIds = [];
        getCustomization_(firstGroupId);
    
        for (const cId of selectedCustomizationIds) {
          let c = customisation_items.find((item) => item.local_id === cId);
          if (c) {
            c = {
              ...c,
              quantity: {
                count: 1,
              },
            };
            customizations.push(c);
          }
        }
    
        return customizations;
      };
    
      function findMinMaxSeq(customizationGroups) {
        if (!customizationGroups || customizationGroups.length === 0) {
          return { minSeq: undefined, maxSeq: undefined };
        }
    
        let minSeq = Infinity;
        let maxSeq = -Infinity;
    
        customizationGroups.forEach((group) => {
          const seq = group.seq;
          if (seq < minSeq) {
            minSeq = seq;
          }
          if (seq > maxSeq) {
            maxSeq = seq;
          }
        });
    
        return { minSeq, maxSeq };
      }
    
      function areCustomisationsSame(existingIds, currentIds) {
        if (existingIds.length !== currentIds.length) {
          return false;
        }
    
        existingIds.sort();
        currentIds.sort();
    
        for (let i = 0; i < existingIds.length; i++) {
          if (existingIds[i] !== currentIds[i]) {
            return false;
          }
        }
    
        return true;
      }
    
      const checkCustomisationIsAvailableInCart = (
        customisations,
        cartItemData
      ) => {
        const cartItem = Object.assign(
          {},
          JSON.parse(JSON.stringify(cartItemData))
        );
        let matchingCustomisation = null;
        if (customisations) {
          const currentIds = customisations.map((item) => item.id);
          let existingIds = cartItem.item.customisations.map((item) => item.id);
          const areSame = areCustomisationsSame(existingIds, currentIds);
          if (areSame) {
            matchingCustomisation = cartItem;
          }
        } else {
        }
        return matchingCustomisation ? true : false;
      };
    
      useEffect(() => {
        if (
          productPayload &&
          productPayload?.id &&
          cartItems &&
          cartItems.length > 0
        ) {
          let isItemAvailable = false;
          let findItem = null;
          if (productPayload?.context.domain === "ONDC:RET11") {
            const customisations = getCustomizations() ?? null;
    
            findItem = customisations
              ? cartItems.find(
                  (item) =>
                    item.item.id === productPayload.id &&
                    checkCustomisationIsAvailableInCart(customisations, item)
                )
              : cartItems.find((item) => item.item.id === productPayload.id);
          } else {
            findItem = cartItems.find((item) => item.item.id === productPayload.id);
          }
          if (findItem) {
            isItemAvailable = true;
            setItemAvailableInCart(findItem);
          } else {
          }
          setIsItemAvailableInCart(isItemAvailable);
        } else {
          setItemAvailableInCart(null);
          setIsItemAvailableInCart(false);
        }
      }, [cartItems, customization_state]);
    
      const addToCart = async (navigate = false, isIncrement = true) => {
        setAddToCartLoading(true);
        const user = JSON.parse(getValueFromCookie("user"));
        const url = `/clientApis/v2/cart/${user.id}`;
        let subtotal = productPayload?.item_details?.price?.value;
    
        const customisations = getCustomizations() ?? null;
    
        if (customisations) {
          calculateSubtotal(
            customization_state["firstGroup"]?.id,
            customization_state
          );
          subtotal += customizationPrices;
        }
    
        const payload = {
          id: productPayload.id,
          local_id: productPayload.local_id,
          bpp_id: productPayload.bpp_details.bpp_id,
          bpp_uri: productPayload.context.bpp_uri,
          domain: productPayload.context.domain,
          tags: productPayload.item_details.tags,
          customisationState: customization_state,
          contextCity: productPayload.context.city,
          quantity: {
            count: 1,
          },
          provider: {
            id: productPayload.bpp_details.bpp_id,
            locations: productPayload.locations,
            ...productPayload.provider_details,
          },
          product: {
            id: productPayload.id,
            subtotal,
            ...productPayload.item_details,
          },
          customisations,
          hasCustomisations: customisations ? true : false,
        };
    
        let cartItem = [];
        cartItem = cartItems.filter((ci) => {
          return ci.item.id === payload.id;
        });
    
        if (customisations) {
          cartItem = cartItem.filter((ci) => {
            return ci.item.customisations != null;
          });
        }
    
        if (cartItem.length > 0 && customisations) {
          cartItem = cartItem.filter((ci) => {
            return ci.item.customisations.length === customisations.length;
          });
        }
    
        if (cartItem.length === 0) {
          const res = await postCall(url, payload);
          getCartItems();
          setAddToCartLoading(false);
          CustomToaster('success',"Item added to cart successfully.")
          
    
          if (navigate) {
            console.log("bhaii close hojaa");
            handleModalClose();
          }
        } else {
          const currentCount = parseInt(cartItem[0].item.quantity.count);
          const maxCount = parseInt(
            cartItem[0].item.product.quantity.maximum.count
          );
    
          if (currentCount < maxCount) {
            if (!customisations) {
              await updateCartItem(cartItems, isIncrement, cartItem[0]._id);
              getCartItems();
              setAddToCartLoading(false);
              CustomToaster('success',"Item quantity updated in your cart.")
              
            } else {
              const currentIds = customisations.map((item) => item.id);
              let matchingCustomisation = null;
    
              for (let i = 0; i < cartItem.length; i++) {
                let existingIds = cartItem[i].item.customisations.map(
                  (item) => item.id
                );
                const areSame = areCustomisationsSame(existingIds, currentIds);
                if (areSame) {
                  matchingCustomisation = cartItem[i];
                }
              }
    
              if (matchingCustomisation) {
                await updateCartItem(
                  cartItems,
                  isIncrement,
                  matchingCustomisation._id
                );
                setAddToCartLoading(false);
                getCartItems();
                CustomToaster('success',"Item quantity updated in your cart.")
              } else {
                const res = await postCall(url, payload);
                getCartItems();
                setAddToCartLoading(false);
                CustomToaster('success',"Item added to cart successfully.");
              }
            }
          } else {
            setAddToCartLoading(false);
            CustomToaster('error',"The maximum available quantity for item is already in your cart.");
          }
        }
      };
    const getProductDetails = async (productId) => {
        try {
        //   setProductLoading(true);
          const data = await cancellablePromise(
            getCall(`/clientApis/v2/item-details?id=${productId}`)
          );
          setProductPayload(data);
          setModalData([data])
          getCartItems();
        } catch (error) {
            CustomToaster('error',error)
        } finally {
        //   setProductLoading(false);
        }
      };
      
      
      const getCartItems = async () => {
        try {
        //   setLoading(true);
        const user = JSON.parse(getValueFromCookie("user"));
          const url = `/clientApis/v2/cart/${user.id}`;
          const res = await getCall(url);
          console.log("cart...",res);
          dispatch(setCartList(res));

          

          const matchingItems = res.filter(cartItem => 
            cartItem.item.id === product.id
          );
        
          if (matchingItems.length === 0) return 0;
          const totalQuantity = matchingItems.reduce((sum, item) => {
            return sum + (item.item.quantity?.count || 0);
          }, 0);

          setQuantity(totalQuantity)



          
        } catch (error) {
          console.log("Error fetching cart items:", error);
        //   setLoading(false);
        } finally {
        //   setLoading(false);
        }
      };
     
      

    
    useEffect(() => {
            getProductDetails(product?.id)
    }, [])
    useEffect(() => {
        if (productPayload) {
            setModalData([productPayload]);
        }
    }, [productPayload]);
    const notify = (i) => toast(i)
    const itemValuesHandler = (itemIndex, variationValues) => {
        const isThisValExistWithinSelectedValues = selectedOptions.filter(
            (sItem) => sItem.choiceIndex === itemIndex
        )
        if (variationValues.length > 0) {
            let newVariation = variationValues.map((vVal, vIndex) => {
                let exist =
                    isThisValExistWithinSelectedValues.length > 0 &&
                    isThisValExistWithinSelectedValues.find(
                        (item) => item.optionIndex === vIndex
                    )
                if (exist) {
                    return exist
                } else {
                    return { ...vVal, isSelected: false }
                }
            })
            return newVariation
        } else {
            return variationValues
        }
    }
    const getNewVariationForDispatch = () => {
        const newVariations = modalData?.[0]?.variations?.map((item, index) => {
            if (selectedOptions.length > 0) {
                return {
                    ...item,
                    values:
                        item.values.length > 0
                            ? itemValuesHandler(index, item.values)
                            : item.values,
                }
            } else {
                return item
            }
        })
        return newVariations
    }
    const handleSuccess = (res) => {
        if (res) {
            let product = {}
            res?.forEach((item) => {
                product = {
                    ...item?.item,
                    cartItemId: item?.id,
                    totalPrice: item?.price,
                    quantity: item?.quantity,
                    variations: item?.item?.variations,
                    selectedAddons: add_on,
                    selectedOptions: selectedOptions,
                    //itemBasePrice: item?.item?.price,
                    itemBasePrice: getConvertDiscount(
                        item?.item?.discount,
                        item?.item?.discount_type,
                        calculateItemBasePrice(modalData[0], selectedOptions),
                        item?.item?.restaurant_discount
                    ),
                }
            })
            // dispatch(setCart(product))
            console.log("products123456",product);
            CustomToaster('success', 'Item added to cart')
            handleClose()
            //dispatch()
        }
    }

    const cartListSuccessHandler = (res) => {
        if (res) {
            const setItemIntoCart = () => {
                return res?.map((item) => ({
                    ...item?.item,
                    cartItemId: item?.id,
                    totalPrice:
                        getConvertDiscount(
                            item?.item?.discount,
                            item?.item?.discount_type,
                            handleProductValueWithOutDiscount(item?.item),
                            item?.item?.restaurant_discount
                        ) * item?.quantity,
                    selectedAddons: getSelectedAddons(item?.item?.addons),
                    quantity: item?.quantity,
                    variations: item?.item?.variations,
                    itemBasePrice: getConvertDiscount(
                        item?.item?.discount,
                        item?.item?.discount_type,
                        calculateItemBasePrice(
                            item?.item,
                            item?.item?.variations
                        ),
                        item?.item?.restaurant_discount
                    ),
                    selectedOptions: getSelectedVariations(
                        item?.item?.variations
                    ),
                }))
            }
            dispatch(cart(setItemIntoCart()))
            CustomToaster('success', 'Item updated successfully')
            //toast.success(t('Item updated successfully'))
            handleModalClose?.()
        }
    }

    const handleAddUpdate = () => {
        if (productUpdate) {
            //for updating
            let totalQty = 0
            const itemObject = {
                cart_id: product?.cart_id,
                guest_id: getGuestId(),
                model: product?.available_date_starts ? 'ItemCampaign' : 'Food',
                add_on_ids:
                    add_on?.length > 0
                        ? add_on?.map((add) => {
                              return add.id
                          })
                        : [],
                add_on_qtys:
                    add_on?.length > 0
                        ? add_on?.map((add) => {
                              totalQty = add.quantity
                              return totalQty
                          })
                        : [],
                item_id: product?.id,
                price: getConvertDiscount(
                    product?.discount,
                    product?.discount_type,
                    totalPrice,
                    product?.restaurant_discount,
                    quantity
                ),
                quantity: quantity,
                variation_options: selectedOptions?.map(
                    (item) => item.option_id
                ),
                variations:
                    getNewVariationForDispatch()?.length > 0
                        ? getNewVariationForDispatch()?.map((variation) => {
                              return {
                                  name: variation.name,
                                  values: {
                                      label: handleValuesFromCartItems(
                                          variation.values
                                      ),
                                  },
                              }
                          })
                        : [],
            }

            updateMutate(itemObject, {
                onSuccess: cartListSuccessHandler,
                onError: (error) => {
                    error?.response?.data?.errors?.forEach((item) => {
                        CustomToaster('error', item?.message)
                        if (item?.code === 'stock_out') {
                            setErrorCode(item?.code)
                            refetch()
                        }
                    })
                },
            })
        } else {
            let isOrderNow = false
            let totalQty = 0
            const itemObject = {
                model: 'Food',
                add_on_ids:
                    add_on?.length > 0
                        ? add_on?.map((add) => {
                              return add.id
                          })
                        : [],
                add_on_qtys:
                    add_on?.length > 0
                        ? add_on?.map((add) => {
                              totalQty = add.quantity
                              return totalQty
                          })
                        : [],
                item_id: modalData[0]?.id,
                price: getConvertDiscount(
                    modalData[0]?.discount,
                    modalData[0]?.discount_type,
                    totalPrice,
                    modalData[0]?.restaurant_discount,
                    quantity
                ),
                quantity: quantity,
                variations:
                    getNewVariationForDispatch()?.length > 0
                        ? getNewVariationForDispatch()?.map((variation) => {
                              return {
                                  name: variation.name,
                                  values: {
                                      label: handleValuesFromCartItems(
                                          variation.values
                                      ),
                                  },
                              }
                          })
                        : [],
                variation_options: selectedOptions?.map(
                    (item) => item.option_id
                ),
            }
            // addToCartMutate(itemObject, {
            //     onSuccess: handleSuccess,
            //     onError: (error) => {
            //         error?.response?.data?.errors?.forEach((item) => {
            //             CustomToaster('error', item?.message)
            //             if (item?.code === 'stock_out') {
            //                 setErrorCode(item?.code)
            //                 refetch()
            //             }
            //         })
            //     },
            // })
            //add to cart API
            addToCart(false,true)
            // .then(
            //     handleSuccess
            // ).catch(
            //     CustomToaster('error','Failed to add product to cart')
            // )
            
        }
        // handleClose?.()
    }
    console.log(cartItems,'CartItem...');
   
    
    

   

    
   

    
    const addToCard = () => {
        // call add to cart api
    }
    const clearCartAlert = () => {
        deleteCartItemMutate(getGuestId(), {
            //onSuccess: handleSuccess,
            onError: onErrorResponse,
        })
        dispatch(setClearCart())

        //setClearCartModal(false)
        toast.success(
            t(
                'Previously added restaurant foods have been removed from cart and the selected one added'
            ),
            {
                duration: 6000,
            }
        )
        handleAddUpdate?.()
    }
    const handleClose = () => setOpen(false)

    
    
    const changeAddOns = (checkTrue, addOn) => {
        let filterAddOn = add_on.filter((item) => item.name !== addOn.name)
        if (checkTrue) {
            setAddOns([...filterAddOn, addOn])
        } else {
            setAddOns(filterAddOn)
        }
    }
    
    useEffect(() => {
        if (modalData[0]) {
            handleTotalPrice()
        }
    }, [quantity, modalData])
    const decrementPrice = () => {
        setQuantity((prevQty) => prevQty - 1)
    }
    // const isShowStockText = (option) => {
    //
    //     return selectedOptions?.some((item) => {
    //         return item?.option_id === option.option_id && quantity  > option.current_stock;
    //     });
    // };

    const incrementPrice = () => {
        const isLimitedOrDaily = modalData[0]?.stock_type !== 'unlimited'
        const maxCartQuantity = modalData[0]?.maximum_cart_quantity
        // Helper function to check stock limits and update quantity
        const tryUpdateQuantity = (stockLimit) => {
            if (quantity >= stockLimit && isLimitedOrDaily) {
                CustomToaster('error', t('Out Of Stock'), 'stock')
            } else if (maxCartQuantity && quantity >= maxCartQuantity) {
                CustomToaster('error', 'Out Of Limits', 'Quantity')
            } else {
                setQuantity((prevQty) => prevQty + 1)
            }
        }

        if (selectedOptions?.length > 0) {
            // Calculate the minimum stock from selected options
            const minStock = selectedOptions.reduce(
                (min, item) => Math.min(min, parseInt(item.current_stock)),
                Infinity
            )
            //setVariationStock(minStock);

            // If stock type is limited or daily, check against minStock
            if (quantity >= modalData[0]?.item_stock && isLimitedOrDaily) {
                CustomToaster('error', t('Out Of Stock'), 'stock')
            } else {
                if (isLimitedOrDaily) {
                    tryUpdateQuantity(minStock)
                } else {
                    // If not limited/daily, just check against max cart quantity
                    tryUpdateQuantity(Infinity)
                }
            }
        } else {
            // No options selected, check directly against item stock or max cart quantity
            const itemStock = modalData[0]?.item_stock
            if (isLimitedOrDaily && itemStock !== undefined) {
                tryUpdateQuantity(itemStock)
            } else {
                tryUpdateQuantity(Infinity)
            }
        }
    }

    

    const onSuccessHandlerForDelete = (res) => {
        dispatch(removeWishListFood(product.id))
        CustomToaster('success', res.message)
    }
    
    const isInCart = (id) => {
            const isInCart = cartList.filter((item) => item?.item?.id === id)
            console.log("same hai kya...", id === cartList?.[0]?.item?.id);
            if (isInCart.length > 0) {
                return true
            } else {
                return false
            }
        

        // return !!cartList.find((item) => item.id === id)
    }

    const isInList = (id) => {
        return !!wishLists?.food?.find((wishFood) => wishFood.id === id)
    }
    //auth modal
    const [authModalOpen, setAuthModalOpen] = useState(false)

    const orderNow = () => {
        
    }
    
    const getFullFillRequirements = () => {
        let isdisabled = false
        if (modalData[0]?.variations?.length > 0) {
            modalData[0]?.variations?.forEach((variation, index) => {
                if (variation?.type === 'multi') {
                    const selectedIndex = selectedOptions?.filter(
                        (item) => item.choiceIndex === index
                    )
                    if (selectedIndex && selectedIndex.length > 0) {
                        isdisabled =
                            selectedIndex.length >= variation.min &&
                            selectedIndex.length <= variation.max
                    }
                } else {
                    const singleVariation = modalData[0]?.variations?.filter(
                        (item) =>
                            item?.type === 'single' && item?.required === 'on'
                    )
                    const requiredSelected = selectedOptions?.filter(
                        (item) => item?.type === 'required'
                    )
                    if (singleVariation?.length === requiredSelected?.length) {
                        isdisabled = true
                    } else {
                        isdisabled = false
                    }
                }
            })
        } else {
            isdisabled = true
        }
        return isdisabled
    }
    // if(!modalData){
    //     return
    // }

    ///////////////////////////////////////custom////////////////////////////////

    const calculateItemPrice = (item, selectedOptions) => {
        const basePrice = item?.item_details?.price?.value || 0;
        const customizationPrice = selectedOptions.reduce((total, option) => {
            return total + (option.price?.value || 0);
        }, 0);
        return basePrice + customizationPrice;
    };
    
    // Modify handleTotalPrice function
    const handleTotalPrice = () => {
        if (modalData[0]) {
            const itemPrice = calculateItemPrice(modalData[0], selectedOptions);
            const total = itemPrice * quantity;
            setTotalPrice(total);
        }
    };
    
    // Update your existing price calculations in handleChange
    const changeChoices = (
        isSingle,
        option,
        choiceIndex,
        optionIndex,
        isRequired,
        choiceType,
        checked
    ) => {
        if (choiceType === 'single') {
            if (checked) {
                setQuantity(1);
                if (selectedOptions.length > 0) {
                    // Handle replacing existing option in same group
                    const newSelectedOptions = selectedOptions.filter(
                        opt => opt.choiceIndex !== choiceIndex
                    );
                    setSelectedOptions([...newSelectedOptions, {
                        choiceIndex,
                        ...option,
                        optionIndex,
                        isSelected: true,
                        type: isRequired ? 'required' : 'optional'
                    }]);
                } else {
                    // Add new option
                    setSelectedOptions([{
                        choiceIndex,
                        ...option,
                        optionIndex,
                        isSelected: true,
                        type: isRequired ? 'required' : 'optional'
                    }]);
                }
            }
        } else {
            // Handle multi-select options
            if (checked) {
                setSelectedOptions(prev => [...prev, {
                    choiceIndex,
                    ...option,
                    optionIndex,
                    isSelected: true,
                    type: isRequired ? 'required' : 'optional'
                }]);
            } else {
                setSelectedOptions(prev => prev.filter(
                    opt => !(opt.choiceIndex === choiceIndex && opt.id === option.id)
                ));
            }
        }
    };
    //////////////////////////////////////////////////////////////////////////

    
    const isVegItem = (data) => {
        const vegTag = data.item_details.tags.find(tag => tag.code === "veg_nonveg");
        if (vegTag) {
            const vegValue = vegTag.list.find(item => item.code === "veg");
            return vegValue && vegValue.value === "yes" ? 1 : 0;
        }
        return "Unknown";
    };
    const vegStatus = isVegItem(modalData[0]);
    const text1 = t('only')
    const text2 = t('items available')
    return (
        <>
            <Modal
                open={open}
                onClose={handleModalClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                disableAutoFocus={true}
            >
                <FoodDetailModalStyle sx={{ bgcolor: 'background.paper' }}>
                                <CustomStackFullWidth>
                                    <FoodModalTopSection
                                        product={modalData[0]}
                                        image={image}
                                        handleModalClose={handleModalClose}
                                        isInList={isInList}
                                    />

                                    <CustomStackFullWidth
                                        sx={{ padding: '20px' }}
                                        spacing={2}
                                    >
                                        <SimpleBar
                                            style={{
                                                maxHeight: '35vh',
                                                paddingRight: '10px',
                                            }}
                                            className="test123"
                                        >
                                            <CustomStackFullWidth spacing={0.5}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="flex-start"
                                                    alignItems="center"
                                                    flexWrap="wrap"
                                                    spacing={0.5}
                                                >
                                                    <Typography variant="h4">
                                                        {modalData.length > 0 &&
                                                            modalData[0]?.item_details?.descriptor?.name}
                                                    </Typography>
                                                    <VagSvg
                                                        color={
                                                            Number(
                                                                vegStatus
                                                            ) === 0
                                                                ? theme.palette
                                                                      .nonVeg
                                                                : theme.palette
                                                                      .success
                                                                      .light
                                                        }
                                                    />
                                                    {modalData[0]
                                                        ?.halal_tag_status ===
                                                        1 &&
                                                        modalData[0]
                                                            ?.is_halal ===
                                                            1 && (
                                                            <Tooltip
                                                                arrow
                                                                title={t(
                                                                    'This is a halal food'
                                                                )}
                                                            >
                                                                <IconButton
                                                                    sx={{
                                                                        padding:
                                                                            '0px',
                                                                    }}
                                                                >
                                                                    <HalalSvg />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    {quantity >=
                                                        modalData[0]
                                                            ?.item_stock &&
                                                        modalData[0]
                                                            ?.stock_type !==
                                                            'unlimited' && (
                                                            <Typography
                                                                fontSize="12px"
                                                                color={
                                                                    quantity >=
                                                                        modalData[0]
                                                                            ?.item_stock &&
                                                                    theme
                                                                        .palette
                                                                        .info
                                                                        .main
                                                                }
                                                            >
                                                                ({text1}{' '}
                                                                {
                                                                    modalData[0]
                                                                        ?.item_stock
                                                                }{' '}
                                                                {text2})
                                                            </Typography>
                                                        )}
                                                </Stack>
                                                <ReadMore
                                                    limits="100"
                                                    color={
                                                        theme.palette
                                                            .neutral[400]
                                                    }
                                                >
                                                    {modalData?.length > 0 &&
                                                        modalData[0]
                                                            ?.item_details?.descriptor?.short_desc}
                                                </ReadMore>
                                                {modalData[0]?.nutritions_name
                                                    ?.length > 0 && (
                                                    <>
                                                        <Typography
                                                            fontSize="14px"
                                                            fontWeight="500"
                                                            mt="5px"
                                                        >
                                                            {t(
                                                                'Nutrition Details'
                                                            )}
                                                        </Typography>

                                
                                                    </>
                                                )}
                                                {modalData[0]?.allergies_name
                                                    ?.length > 0 && (
                                                    <>
                                                        <Typography
                                                            fontSize="14px"
                                                            fontWeight="500"
                                                            mt="5px"
                                                        >
                                                            {t(
                                                                'Allergic Ingredients'
                                                            )}
                                                        </Typography>

                                                        <Stack
                                                            direction="row"
                                                            spacing={0.5}
                                                        >
                                                            {modalData[0]?.allergies_name?.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (
                                                                    <Typography
                                                                        fontSize="12px"
                                                                        key={
                                                                            index
                                                                        }
                                                                        color={
                                                                            theme
                                                                                .palette
                                                                                .neutral[400]
                                                                        }
                                                                    >
                                                                        {item}
                                                                        {index !==
                                                                        modalData[0]
                                                                            ?.allergies_name
                                                                            .length -
                                                                            1
                                                                            ? ','
                                                                            : '.'}
                                                                    </Typography>
                                                                )
                                                            )}
                                                        </Stack>
                                                    </>
                                                )}
                                                <Stack
                                                    spacing={1}
                                                    direction={{
                                                        xs: 'row',
                                                        sm: 'row',
                                                        md: 'row',
                                                    }}
                                                    justifyContent={{
                                                        xs: 'space-between',
                                                        sm: 'space-between',
                                                        md: 'space-between',
                                                    }}
                                                    alignItems="center"
                                                >
                                                    <StartPriceView
                                                        data={modalData[0]}
                                                        currencySymbolDirection={
                                                            'left'
                                                        }
                                                        currencySymbol={
                                                            '₹'
                                                        }
                                                        digitAfterDecimalPoint={
                                                            2
                                                        }
                                                        hideStartFromText="false"
                                                        handleBadge={
                                                            handleBadge
                                                        }
                                                        selectedOptions={
                                                            selectedOptions
                                                        }
                                                    />

                                                    
                                                </Stack>
                                            </CustomStackFullWidth>
                                            {/* {modalData?.length > 0 &&
                                                modalData[0]?.variations
                                                    ?.length > 0 && (
                                                    <VariationsManager
                                                        variationStock={
                                                            variationStock
                                                        }
                                                        quantity={quantity}
                                                        selectedOptions={
                                                            selectedOptions
                                                        }
                                                        t={t}
                                                        modalData={modalData}
                                                        radioCheckHandler={
                                                            radioCheckHandler
                                                        }
                                                        changeChoices={
                                                            changeChoices
                                                        }
                                                        currencySymbolDirection={
                                                            currencySymbolDirection
                                                        }
                                                        currencySymbol={
                                                            currencySymbol
                                                        }
                                                        digitAfterDecimalPoint={
                                                            digitAfterDecimalPoint
                                                        }
                                                        itemIsLoading={
                                                            isRefetching
                                                        }
                                                        productUpdate={
                                                            productUpdate
                                                        }
                                                    />
                                                )} */}
                                                {modalData?.length > 0 && modalData[0]?.customisation_groups?.length > 0 && (
                                                <Stack spacing={3} sx={{ my: 2 }}>
                                                    {modalData[0]?.customisation_groups?.map(group => {
                                                    const groupItems = modalData[0].customisation_items?.filter(
                                                        item => item.customisation_group_id === group.id
                                                    );
                                                    
                                                    return (
                                                        <CustomizationSection
                                                        key={group.id}
                                                        group={group}
                                                        items={groupItems}
                                                        selectedOptions={selectedOptions}
                                                        onCustomizationChange={changeChoices}
                                                        quantity={quantity}
                                                        />
                                                    );
                                                    })}
                                                </Stack>
                                                )}
                                            {modalData?.length > 0 &&
                                                modalData[0]?.add_ons?.length >
                                                    0 && (
                                                    <AddOnsManager
                                                        t={t}
                                                        modalData={modalData}
                                                        setTotalPrice={
                                                            setTotalPrice
                                                        }
                                                        setVarPrice={
                                                            setVarPrice
                                                        }
                                                        changeAddOns={
                                                            changeAddOns
                                                        }
                                                        setProductAddOns={
                                                            setProductAddOns
                                                        }
                                                        product={modalData[0]}
                                                        setAddOns={setAddOns}
                                                        add_on={add_on}
                                                        quantity={quantity}
                                                        cartList={cartList}
                                                        itemIsLoading={
                                                            isRefetching
                                                        }
                                                    />
                                                )}
                                                <RestaurantMDetails data={modalData[0]} />
                                        </SimpleBar>
                                        <Grid container direction="column">
                                            <Grid
                                                item
                                                md={7}
                                                sm={12}
                                                xs={12}
                                                alignSelf="center"
                                            >
                                                <TotalAmountVisibility
    modalData={modalData}
    selectedOptions={selectedOptions}
    quantity={quantity}
    currencySymbolDirection={currencySymbolDirection}
    currencySymbol={currencySymbol}
    digitAfterDecimalPoint={digitAfterDecimalPoint}
    t={t}
/>

                                            </Grid>
                                            <Grid
                                                item
                                                md={
                                                    !modalData[0].in_stock
                                                        ? 12
                                                        : 5
                                                }
                                                sm={12}
                                                xs={12}
                                            >
                                                {modalData?.length > 0
                                                &&(
                                                    <>
                                                        
                                                        
                                                            <AddOrderToCart
                                                                addToCartLoading={
                                                                    false
                                                                }
                                                                isInCart = {isInCart(
                                                                    modalData[0].id
                                                                )}
                                                                product={
                                                                    modalData[0]
                                                                }
                                                                t={t}
                                                                addToCard={
                                                                    () => addToCart(false, true)
                                                                }
                                                                orderNow={
                                                                    () => addToCart(true)

                                                                }
                                                                incrementItem={() => addToCart(false, true)}
                                                                decrementItem={()=>deleteCartItem(itemAvailableInCart._id)}
                                                                quantity={quantity}
                                                            />
                                                        
                                                    </>
                                                )}
                                            </Grid>
                                        </Grid>
                                    </CustomStackFullWidth>
                                </CustomStackFullWidth>
                </FoodDetailModalStyle>
            </Modal>
            <CartClearModal
                clearCartModal={clearCartModal}
                setClearCartModal={setClearCartModal}
                clearCartAlert={clearCartAlert}
                addToCard={addToCard}
            />
            {authModalOpen && (
                <AuthModal
                    open={authModalOpen}
                    handleClose={() => setAuthModalOpen(false)}
                    signInSuccess={handleSignInSuccess}
                    modalFor={modalFor}
                    setModalFor={setModalFor}
                />
            )}
        </>
    )
}

export default FoodDetailModal
