import { FC, useState, useEffect, useContext } from "react";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
	supabase: any;
}

export const ListItems: FC<Props> = ({ supabase }) => {
	const [items, setItems] = useState([]);

	const { orderContext, setOrderContext } = useContext(OrderContext);

	useEffect(() => {
		const fetchItems = async () => {
			const { data, error } = await supabase
				.from("items")
				.select("id, name, price")
				.limit(10)
				.order("created_at", { ascending: false });

			if (error) {
				alert(JSON.stringify(error));
			}

			if (data.length) {
				setItems(data);
			}
		};

		fetchItems();
	}, []);

	const addToCard = async (e) => {
		const itemId = e.target.getAttribute("data-item-id");
		const itemPrice = e.target.getAttribute("data-item-price");

		if (!orderContext.partner_id) {
			return alert("Please select a partner");
		}

		const { data: order, error: orderError } = await supabase.functions.invoke(
			"customer-order",
			{
				headers: {
					"x-invoke-func": "get-order-draft",
				},
				body: {
					payload: {
						partner_id: orderContext.partner_id,
					},
				},
			}
		);

		if (orderError) {
			return alert(JSON.stringify(orderError));
		}

		const { error } = await supabase.functions.invoke("customer-order", {
			headers: {
				"x-invoke-func": "add-orderline",
			},
			body: {
				payload: {
					item_id: itemId,
					order_id: order.data?.id,
					price: itemPrice,
					quantity: 1,
					note: "note",
				},
			},
		});

    if(!error) {
      setOrderContext({
        ...orderContext,
        refresh: Date.now(),
      })
      alert('Item added to card')
    }
	};

	return (
		<div>
			<h1>List Items</h1>
			<div>
				{!!items.length &&
					items.map((item) => (
						<div key={item.id}>
							<p>Name: {item.name}</p>
							<p>Price: {item.price}</p>
							<button
								onClick={addToCard}
								data-item-id={item.id}
								data-item-price={item.price}
							>
								Add to card
							</button>
							<hr />
						</div>
					))}
			</div>
		</div>
	);
};
