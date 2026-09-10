import { YStack, Text } from "tamagui";

export default function Index() {
	return (
		<YStack grow={1} justify="center" items="center" gap="$4">
			<Text fontSize="$8" fontWeight="bold">
				Meal Planner
			</Text>
			<Text color="$color.gray9">Initial scaffold — no content yet</Text>
		</YStack>
	);
}
