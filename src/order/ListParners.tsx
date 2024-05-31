import { FC, useState, useEffect, useContext } from "react";
import { OrderContext } from "../contexts/OrderContext";

interface Props {
	supabase: any;
}

export const ListPartners: FC<Props> = ({ supabase }) => {
	const [partners, setPartners] = useState([]);
	const { setOrderContext } = useContext(OrderContext);

	useEffect(() => {
		const fetchParners = async () => {
			const { data, error } = await supabase
				.from("partners")
				.select("id, business_name, email")
				.eq("is_active", true)
				.limit(10);

			if (error) {
				alert(JSON.stringify(error));
			}

			if (data.length) {
				setPartners(data);
			}
		};

		fetchParners();
	}, []);

	const getOrderDraft = async (partner_id) => {
		const { data, error } = await supabase.functions.invoke("customer-order", {
			headers: {
				"x-invoke-func": "get-order-draft",
			},
			body: {
				payload: {
					partner_id,
				},
			},
		});

		if (error) {
			return "";
		}

		return data.data?.id;
	};

	const onChangeInput = async (e) => {
		const { name, value } = e.target;
		const orderId = await getOrderDraft(value);

		setOrderContext({ ...setOrderContext, order_id: orderId, [name]: value });
	};

	return (
		<div>
			<h1>List Partners</h1>
			<div>
				<select name="partner_id" onChange={onChangeInput}>
					{!!partners.length &&
						partners.map((partner) => (
							<option key={partner.id} value={partner.id}>
								{partner.business_name}
							</option>
						))}
				</select>
			</div>
		</div>
	);
};
