import { useEffect, useRef, useState } from "react";

export const Todo = ({ supabase }) => {
	const [todos, setTodos] = useState([]);
	const inputRef = useRef(null);

	useEffect(() => {
		const fetchTodos = async () => {
			const { data, error } = await supabase
				.from("todos")
				.select("*")
				.order("created_at", { ascending: false });

			!error && setTodos(data);
		};

		supabase && fetchTodos();
	}, [supabase]);

	const handleAddTodo = async () => {
		const value = inputRef.current.value;

		const { quote } = await (await fetch("https://api.kanye.rest")).json();

		const { data } = await supabase.rpc("add_todo", {
			name: value,
			description: quote,
		});

		setTodos((curr) => {
			return [...curr, { id: data, title: value, description: quote }];
		});
		inputRef.current.value = "";
	};

	return (
		<div style={{ width: "300px" }}>
			<h1>Todo</h1>
			<ul>
				{todos.map((todo) => (
					<li key={todo.id}>
						{todo.id} - {todo.title}
					</li>
				))}
			</ul>
			<div>
				<input ref={inputRef} />
				<button onClick={handleAddTodo}>Add todo</button>
			</div>
		</div>
	);
};
